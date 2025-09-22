// Background script for Tradr extension

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tradr-schedule') {
    executeScheduledTask();
  }
});

async function executeScheduledTask() {
  const { url, jsCode, sink, postUrl } = await chrome.storage.sync.get(['url', 'jsCode', 'sink', 'postUrl']);
  if (!url || !jsCode) return;

  const tab = await chrome.tabs.create({ url });
  const execute = () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: (code, sinkType, postUrl) => {
        window.tradrSink = (data) => {
          window.postMessage({ action: 'debug', message: 'Sink called with data: ' + JSON.stringify(data).substring(0, 100) }, '*');
          if (sinkType === 'clipboard') {
            navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data)).catch(e => window.postMessage({ action: 'debug', message: 'Clipboard error: ' + e }, '*'));
          } else if (sinkType === 'csv') {
            const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            window.postMessage({ action: 'debug', message: 'CSV: ' + csv.substring(0, 100) }, '*');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.csv';
            a.click();
          } else if (sinkType === 'post') {
            fetch(postUrl, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).catch(e => window.postMessage({ action: 'debug', message: 'Post error: ' + e }, '*'));
          }
        };
        console.log('Code to eval:', code);
        try {
          eval(code);
        } catch (e) {
          console.error('Code error:', e);
          window.postMessage({ action: 'showError', error: 'Code error: ' + e + (e.stack ? '\n' + e.stack : '') }, '*');
        }
      },
      args: [jsCode, sink, postUrl]
    }).catch(e => chrome.runtime.sendMessage({ action: 'showError', error: 'Execute error: ' + e }));
  };

  const tabInfo = await chrome.tabs.get(tab.id);
  if (tabInfo.status === 'complete') {
    execute();
  } else {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        execute();
      }
    });
  }
}

function setSchedule(intervalSeconds) {
  const intervalMinutes = intervalSeconds / 60;
  chrome.alarms.create('tradr-schedule', { delayInMinutes: intervalMinutes, periodInMinutes: intervalMinutes });
}

function clearSchedule() {
  chrome.alarms.clear('tradr-schedule');
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'setSchedule') {
    setSchedule(message.interval);
  } else if (message.action === 'clearSchedule') {
    clearSchedule();
  } else if (message.action === 'runOnce') {
    executeScheduledTask();
  } else if (message.action === 'debug') {
    chrome.runtime.sendMessage({ action: 'showDebug', message: message.message });
  }
});

chrome.action.onClicked.addListener(async () => {
  const displays = await chrome.system.display.getInfo();
  const primaryDisplay = displays[0];
  const screenWidth = primaryDisplay.bounds.width;
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 350,
    height: 800,
    top: 50,
    left: screenWidth - 400
  });
});