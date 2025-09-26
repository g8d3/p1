// Popup script

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  document.getElementById('preset').addEventListener('change', onPresetChange);
  document.getElementById('sink').addEventListener('change', onSinkChange);
  
   document.getElementById('save').addEventListener('click', saveSettings);
   document.getElementById('testAPI').addEventListener('click', testAPI);
   document.getElementById('runOnce').addEventListener('click', runOnce);
   document.getElementById('start').addEventListener('click', startSchedule);
   document.getElementById('stop').addEventListener('click', stopSchedule);
   document.getElementById('startAutonomous').addEventListener('click', startAutonomous);
});

chrome.runtime.onMessage.addListener((message) => {
   if (message.action === 'showError') {
     showError(message.error);
   } else if (message.action === 'showDebug') {
     showAILog(message.message);
   } else if (message.action === 'showData') {
     showData(message.data);
   }
});

function showData(data) {
  const dataDiv = document.getElementById('data');
  dataDiv.textContent = JSON.stringify(data, null, 2);
  dataDiv.style.display = 'block';
}

function loadSettings() {
   chrome.storage.sync.get(['interval', 'url', 'jsCode', 'sink', 'postUrl', 'apiKey', 'baseUrl', 'model'], (result) => {
     document.getElementById('interval').value = result.interval || '';
     document.getElementById('url').value = result.url || '';
     document.getElementById('jsCode').value = result.jsCode || '';
     document.getElementById('sink').value = result.sink || 'display';
     document.getElementById('postUrl').value = result.postUrl || '';
     document.getElementById('apiKey').value = result.apiKey || '';
     document.getElementById('baseUrl').value = result.baseUrl || 'https://api.openai.com/v1';
     document.getElementById('model').value = result.model || 'gpt-3.5-turbo';
     onSinkChange(); // to show/hide postUrl
   });
}

function onPresetChange() {
  const preset = document.getElementById('preset').value;
  if (preset) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('presets/' + preset + '.js');
    script.onload = () => {
      document.getElementById('interval').value = presetInterval;
      document.getElementById('url').value = presetUrl;
      document.getElementById('jsCode').value = presetCode.toString().slice(12, -1).trim();
      document.head.removeChild(script);
    };
    script.onerror = () => {
      showError('Failed to load preset script');
      document.head.removeChild(script);
    };
    document.head.appendChild(script);
  } else {
    document.getElementById('interval').value = '';
    document.getElementById('url').value = '';
    document.getElementById('jsCode').value = '';
  }
}

function onSinkChange() {
  const sink = document.getElementById('sink').value;
  const postUrlLabel = document.getElementById('postUrlLabel');
  const postUrl = document.getElementById('postUrl');
  if (sink === 'post') {
    postUrlLabel.style.display = 'block';
    postUrl.style.display = 'block';
  } else {
    postUrlLabel.style.display = 'none';
    postUrl.style.display = 'none';
  }
}

function saveSettings() {
   const interval = document.getElementById('interval').value;
   const url = document.getElementById('url').value;
   const jsCode = document.getElementById('jsCode').value;
   const sink = document.getElementById('sink').value;
   const postUrl = document.getElementById('postUrl').value;
   const apiKey = document.getElementById('apiKey').value;
   const baseUrl = document.getElementById('baseUrl').value;
   const model = document.getElementById('model').value;

   chrome.storage.sync.set({ interval: parseInt(interval), url, jsCode, sink, postUrl, apiKey, baseUrl, model });
   showMessage('Settings saved');
}

function runOnce() {
  chrome.runtime.sendMessage({ action: 'runOnce' });
  showMessage('Running once...');
}

function showMessage(text) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}

function showError(text) {
   const err = document.getElementById('error');
   err.textContent = text;
   err.style.display = 'block';
   // Don't auto-hide errors
}

function showAILog(text) {
   const log = document.getElementById('aiLog');
   log.style.display = 'block';
   log.textContent += new Date().toLocaleTimeString() + ': ' + text + '\n';
   log.scrollTop = log.scrollHeight;
}

function startSchedule() {
  const interval = document.getElementById('interval').value;
  if (!interval) {
    showMessage('Please set an interval');
    return;
  }
  chrome.runtime.sendMessage({ action: 'setSchedule', interval: parseInt(interval) });
  showMessage('Schedule started');
}

function stopSchedule() {
   chrome.runtime.sendMessage({ action: 'clearSchedule' });
   showMessage('Schedule stopped');
}

function startAutonomous() {
   chrome.runtime.sendMessage({ action: 'startAutonomous' });
   showMessage('Autonomous mode started');
}

function testAPI() {
   chrome.runtime.sendMessage({ action: 'testAPI' });
   showMessage('Testing API...');
}