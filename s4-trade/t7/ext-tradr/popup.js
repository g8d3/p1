// Popup script

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  document.getElementById('preset').addEventListener('change', onPresetChange);
  document.getElementById('sink').addEventListener('change', onSinkChange);
  
  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('runOnce').addEventListener('click', runOnce);
  document.getElementById('start').addEventListener('click', startSchedule);
  document.getElementById('stop').addEventListener('click', stopSchedule);
});

function loadSettings() {
  chrome.storage.sync.get(['interval', 'url', 'jsCode', 'sink', 'postUrl'], (result) => {
    document.getElementById('interval').value = result.interval || '';
    document.getElementById('url').value = result.url || '';
    document.getElementById('jsCode').value = result.jsCode || '';
    document.getElementById('sink').value = result.sink || 'clipboard';
    document.getElementById('postUrl').value = result.postUrl || '';
    onSinkChange(); // to show/hide postUrl
  });
}

function onPresetChange() {
  const preset = document.getElementById('preset').value;
  if (preset === 'coingecko-gainers') {
    document.getElementById('interval').value = 3600;
    document.getElementById('url').value = 'https://www.coingecko.com/en/crypto-gainers-losers';
    document.getElementById('jsCode').value = `const table = document.querySelector('table');
const data = Array.from(table.rows).slice(1).map(row => 
  Array.from(row.cells).map(cell => cell.textContent.trim())
);
tradrSink(data);`;
  } else if (preset === 'local-test') {
    document.getElementById('interval').value = 10;
    document.getElementById('url').value = 'http://localhost:8080/test.html';
    document.getElementById('jsCode').value = `try {
  const table = document.querySelector('table');
  if (!table) throw 'Table not found';
  const data = Array.from(table.rows).slice(1).map(row => 
    Array.from(row.cells).map(cell => cell.textContent.trim())
  );
  tradrSink(data);
} catch (e) {
  tradrSink('Error: ' + e);
}`;
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
  
  chrome.storage.sync.set({ interval: parseInt(interval), url, jsCode, sink, postUrl });
  alert('Settings saved');
}

function runOnce() {
  chrome.runtime.sendMessage({ action: 'runOnce' });
  alert('Running once...');
}

function startSchedule() {
  const interval = document.getElementById('interval').value;
  if (!interval) {
    alert('Please set an interval');
    return;
  }
  chrome.runtime.sendMessage({ action: 'setSchedule', interval: parseInt(interval) });
  alert('Schedule started');
}

function stopSchedule() {
  chrome.runtime.sendMessage({ action: 'clearSchedule' });
  alert('Schedule stopped');
}