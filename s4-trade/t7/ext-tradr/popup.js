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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'showError') {
    alert(message.error);
  }
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
    document.getElementById('jsCode').value = `setTimeout(function() {
  alert('Timeout running');
  var table = document.querySelector('table');
  if (!table) {
    tradrSink('Table not found');
    return;
  }
  var headers = Array.from(table.rows[0].cells).slice(1).map(function(cell) { return cell.textContent.trim(); });
  var rows = Array.from(table.rows).slice(1).map(function(row) {
    var cells = Array.from(row.cells);
    var texts = cells.map(function(cell) { return cell.textContent.trim(); });
    var linkCell = cells[2];
    var a = linkCell ? linkCell.querySelector('a') : null;
    var href = a ? a.href : '';
    var img = linkCell ? linkCell.querySelector('img') : null;
    var src = img ? img.src : '';
    var parts = src.split('/');
    var imageId = parts[5] || '';
    var nameSymbol = texts[2] ? texts[2].split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
    var processedRow = [
      texts[1] || '',
      nameSymbol[0] || '',
      nameSymbol[1] || '',
      texts[3] || '',
      texts[4] || '',
      texts[5] || '',
      href,
      imageId
    ];
    return processedRow;
  });
  var data = [headers].concat(rows);
  tradrSink(data);
}, 5000);`;
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