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
   document.getElementById('saveSession').addEventListener('click', saveCurrentSession);
   document.getElementById('loadSession').addEventListener('click', loadSelectedSession);
   document.getElementById('deleteSession').addEventListener('click', deleteSelectedSession);
   document.getElementById('exportSession').addEventListener('click', exportSelectedSession);
   document.getElementById('sessionSelect').addEventListener('change', displaySessionContent);
  document.getElementById('dataFilter').addEventListener('input', () => {
    currentPage = 1;
    renderDataTable();
  });
  document.getElementById('sessionFilter').addEventListener('input', () => {
    currentSessionPage = 1;
    renderSessionTable();
  });
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

let currentData = [];
let currentSortColumn = null;
let currentSortDirection = 'asc';
let currentPage = 1;
const itemsPerPage = 10;

let currentSessionData = [];
let currentSessionSortColumn = null;
let currentSessionSortDirection = 'asc';
let currentSessionPage = 1;

function showData(data) {
  currentData = Array.isArray(data) ? data : [data];
  currentPage = 1;
  renderDataTable();
  const container = document.getElementById('dataContainer');
  if (container) container.style.display = 'block';
}

function renderDataTable() {
  const container = document.getElementById('dataContainer');
  const tableHead = document.getElementById('dataTableHead');
  const tableBody = document.getElementById('dataTableBody');
  const filterInput = document.getElementById('dataFilter');
  if (!container || !tableHead || !tableBody || !filterInput) return;

  if (currentData.length === 0) {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '<tr><td colspan="100%">No data to display</td></tr>';
    return;
  }

  // Get all unique keys from the data
  const allKeys = new Set();
  currentData.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });
  const columns = Array.from(allKeys);

  // Create header
  tableHead.innerHTML = '<tr>' + columns.map(col => `<th onclick="sortDataTable('${col}')">${col} ${currentSortColumn === col ? (currentSortDirection === 'asc' ? '↑' : '↓') : ''}</th>`).join('') + '</tr>';

  // Filter data
  const filterText = filterInput.value.toLowerCase();
  let filteredData = currentData;
  if (filterText) {
    filteredData = currentData.filter(item => {
      return columns.some(col => {
        const value = item[col];
        return value && value.toString().toLowerCase().includes(filterText);
      });
    });
  }

  // Sort data
  if (currentSortColumn) {
    filteredData.sort((a, b) => {
      const aVal = a[currentSortColumn];
      const bVal = b[currentSortColumn];
      let result = 0;
      if (aVal < bVal) result = -1;
      if (aVal > bVal) result = 1;
      return currentSortDirection === 'asc' ? result : -result;
    });
  }

  // Paginate
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  // Create body
  tableBody.innerHTML = pageData.map(row => {
    return '<tr>' + columns.map(col => {
      const value = row[col];
      const displayValue = value === null || value === undefined ? '' : (typeof value === 'object' ? JSON.stringify(value) : value.toString());
      return `<td>${displayValue}</td>`;
    }).join('') + '</tr>';
  }).join('');

  // Update pagination
  updatePagination('dataPagination', totalPages);
}

function sortDataTable(column) {
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = 'asc';
  }
  currentPage = 1;
  renderDataTable();
}

function renderSessionTable() {
  const container = document.getElementById('sessionContainer');
  const tableHead = document.getElementById('sessionTableHead');
  const tableBody = document.getElementById('sessionTableBody');
  const filterInput = document.getElementById('sessionFilter');
  if (!container || !tableHead || !tableBody || !filterInput) return;

  if (currentSessionData.length === 0) {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '<tr><td colspan="2">No session data to display</td></tr>';
    return;
  }

  // Create header
  tableHead.innerHTML = '<tr><th onclick="sortSessionTable(\'key\')">Key ' + (currentSessionSortColumn === 'key' ? (currentSessionSortDirection === 'asc' ? '↑' : '↓') : '') + '</th><th onclick="sortSessionTable(\'value\')">Value ' + (currentSessionSortColumn === 'value' ? (currentSessionSortDirection === 'asc' ? '↑' : '↓') : '') + '</th></tr>';

  // Filter data
  const filterText = filterInput.value.toLowerCase();
  let filteredData = currentSessionData;
  if (filterText) {
    filteredData = currentSessionData.filter(item => {
      return item.key.toLowerCase().includes(filterText) || item.value.toString().toLowerCase().includes(filterText);
    });
  }

  // Sort data
  if (currentSessionSortColumn) {
    filteredData.sort((a, b) => {
      const aVal = a[currentSessionSortColumn];
      const bVal = b[currentSessionSortColumn];
      let result = 0;
      if (aVal < bVal) result = -1;
      if (aVal > bVal) result = 1;
      return currentSessionSortDirection === 'asc' ? result : -result;
    });
  }

  // Paginate
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentSessionPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  // Create body
  tableBody.innerHTML = pageData.map(row => {
    return `<tr><td>${row.key}</td><td>${row.value}</td></tr>`;
  }).join('');

  // Update pagination
  updateSessionPagination(totalPages);
}

function sortSessionTable(column) {
  if (currentSessionSortColumn === column) {
    currentSessionSortDirection = currentSessionSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSessionSortColumn = column;
    currentSessionSortDirection = 'asc';
  }
  currentSessionPage = 1;
  renderSessionTable();
}

function updateSessionPagination(totalPages) {
  const paginationDiv = document.getElementById('sessionPagination');
  if (totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  let html = '<button onclick="changeSessionPage(1)">First</button>';
  html += `<button onclick="changeSessionPage(${currentSessionPage - 1})" ${currentSessionPage === 1 ? 'disabled' : ''}>Prev</button>`;

  const startPage = Math.max(1, currentSessionPage - 2);
  const endPage = Math.min(totalPages, currentSessionPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    html += `<button onclick="changeSessionPage(${i})" ${i === currentSessionPage ? 'class="active"' : ''}>${i}</button>`;
  }

  html += `<button onclick="changeSessionPage(${currentSessionPage + 1})" ${currentSessionPage === totalPages ? 'disabled' : ''}>Next</button>`;
  html += `<button onclick="changeSessionPage(${totalPages})">Last</button>`;

  paginationDiv.innerHTML = html;
}

function changeSessionPage(page) {
  currentSessionPage = page;
  renderSessionTable();
}

function updatePagination(paginationId, totalPages) {
  const paginationDiv = document.getElementById(paginationId);
  if (totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  let html = '<button onclick="changePage(1)">First</button>';
  html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    html += `<button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
  }

  html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
  html += `<button onclick="changePage(${totalPages})">Last</button>`;

  paginationDiv.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderDataTable();
}

// Add event listener for filter
document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  document.getElementById('dataFilter').addEventListener('input', () => {
    currentPage = 1;
    renderDataTable();
  });
});

function loadSettings() {
     chrome.storage.sync.get(['interval', 'url', 'jsCode', 'sink', 'postUrl', 'apiKey', 'baseUrl', 'model', 'maxSessions'], (result) => {
       const intervalEl = document.getElementById('interval');
       if (intervalEl) intervalEl.value = result.interval || '';
       const urlEl = document.getElementById('url');
       if (urlEl) urlEl.value = result.url || '';
       const jsCodeEl = document.getElementById('jsCode');
       if (jsCodeEl) jsCodeEl.value = result.jsCode || '';
       const sinkEl = document.getElementById('sink');
       if (sinkEl) sinkEl.value = result.sink || 'display';
       const postUrlEl = document.getElementById('postUrl');
       if (postUrlEl) postUrlEl.value = result.postUrl || '';
       const apiKeyEl = document.getElementById('apiKey');
       if (apiKeyEl) apiKeyEl.value = result.apiKey || '';
       const baseUrlEl = document.getElementById('baseUrl');
       if (baseUrlEl) baseUrlEl.value = result.baseUrl || 'https://api.openai.com/v1';
       const modelEl = document.getElementById('model');
       if (modelEl) modelEl.value = result.model || 'gpt-3.5-turbo';
       const maxSessionsEl = document.getElementById('maxSessions');
       if (maxSessionsEl) maxSessionsEl.value = result.maxSessions || 10;
       onSinkChange(); // to show/hide postUrl
       loadSessions();
     });
}

function onPresetChange() {
  const presetEl = document.getElementById('preset');
  if (!presetEl) return;
  const preset = presetEl.value;
  if (preset) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('presets/' + preset + '.js');
    script.onload = () => {
      const intervalEl = document.getElementById('interval');
      if (intervalEl) intervalEl.value = presetInterval;
      const urlEl = document.getElementById('url');
      if (urlEl) urlEl.value = presetUrl;
      const jsCodeEl = document.getElementById('jsCode');
      if (jsCodeEl) jsCodeEl.value = presetCode.toString().slice(12, -1).trim();
      document.head.removeChild(script);
    };
    script.onerror = () => {
      showError('Failed to load preset script');
      document.head.removeChild(script);
    };
    document.head.appendChild(script);
  } else {
    const intervalEl = document.getElementById('interval');
    if (intervalEl) intervalEl.value = '';
    const urlEl = document.getElementById('url');
    if (urlEl) urlEl.value = '';
    const jsCodeEl = document.getElementById('jsCode');
    if (jsCodeEl) jsCodeEl.value = '';
  }
}

function onSinkChange() {
  const sinkEl = document.getElementById('sink');
  if (!sinkEl) return;
  const sink = sinkEl.value;
  const postUrlLabel = document.getElementById('postUrlLabel');
  const postUrl = document.getElementById('postUrl');
  if (sink === 'post') {
    if (postUrlLabel) postUrlLabel.style.display = 'block';
    if (postUrl) postUrl.style.display = 'block';
  } else {
    if (postUrlLabel) postUrlLabel.style.display = 'none';
    if (postUrl) postUrl.style.display = 'none';
  }
}

function saveSettings() {
     const intervalEl = document.getElementById('interval');
     const urlEl = document.getElementById('url');
     const jsCodeEl = document.getElementById('jsCode');
     const sinkEl = document.getElementById('sink');
     const postUrlEl = document.getElementById('postUrl');
     const apiKeyEl = document.getElementById('apiKey');
     const baseUrlEl = document.getElementById('baseUrl');
     const modelEl = document.getElementById('model');
     const maxSessionsEl = document.getElementById('maxSessions');
     if (!intervalEl || !urlEl || !jsCodeEl || !sinkEl || !postUrlEl || !apiKeyEl || !baseUrlEl || !modelEl || !maxSessionsEl) return;
     const interval = intervalEl.value;
     const url = urlEl.value;
     const jsCode = jsCodeEl.value;
     const sink = sinkEl.value;
     const postUrl = postUrlEl.value;
     const apiKey = apiKeyEl.value;
     const baseUrl = baseUrlEl.value;
     const model = modelEl.value;
     const maxSessions = maxSessionsEl.value;

    chrome.storage.sync.set({ interval: parseInt(interval), url, jsCode, sink, postUrl, apiKey, baseUrl, model, maxSessions: parseInt(maxSessions) });
    showMessage('Settings saved');
}

function runOnce() {
  chrome.runtime.sendMessage({ action: 'runOnce' });
  showMessage('Running once...');
}

function showMessage(text) {
  const msg = document.getElementById('message');
  if (!msg) return;
  msg.textContent = text;
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}

function showError(text) {
    const err = document.getElementById('error');
    if (!err) return;
    err.textContent = text;
    err.style.display = 'block';
    // Don't auto-hide errors
}

function showAILog(text) {
    const log = document.getElementById('aiLog');
    if (!log) return;
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

function loadSessions() {
  chrome.storage.sync.get(['sessions'], (result) => {
    const sessions = result.sessions || [];
    const select = document.getElementById('sessionSelect');
    if (!select) return;
    select.innerHTML = '';
    sessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = `${new Date(session.id).toLocaleString()} - ${session.name || 'Unnamed'}`;
      select.appendChild(option);
    });
  });
}

function saveCurrentSession() {
  // For now, save the current aiLog and data as a session
  const aiLogEl = document.getElementById('aiLog');
  const dataEl = document.getElementById('data');
  if (!aiLogEl || !dataEl) {
    showError('Cannot save session: UI elements not found');
    return;
  }
  const aiLog = aiLogEl.textContent;
  const data = dataEl.textContent;
  const session = {
    id: Date.now(),
    name: 'Manual Save',
    messages: aiLog ? [{ role: 'system', content: aiLog }] : [],
    data: data || []
  };
  chrome.storage.sync.get(['sessions', 'maxSessions'], (result) => {
    let sessions = result.sessions || [];
    sessions.unshift(session); // Add to front
    const max = result.maxSessions || 10;
    if (sessions.length > max) {
      sessions = sessions.slice(0, max);
    }
    chrome.storage.sync.set({ sessions }, () => {
      loadSessions();
      showMessage('Session saved');
    });
  });
}

function loadSelectedSession() {
  const select = document.getElementById('sessionSelect');
  if (!select) return;
  const sessionId = select.value;
  if (!sessionId) return;
  chrome.storage.sync.get(['sessions'], (result) => {
    const sessions = result.sessions || [];
    const session = sessions.find(s => s.id == sessionId);
    if (session) {
      currentSessionData = flattenSessionData(session);
      currentSessionPage = 1;
      renderSessionTable();
      const container = document.getElementById('sessionContainer');
      if (container) container.style.display = 'block';
    }
  });
}

function flattenSessionData(session) {
  const flattened = [];

  // Add basic session info
  flattened.push({ key: 'Session ID', value: session.id });
  flattened.push({ key: 'Name', value: session.name || 'Unnamed' });
  flattened.push({ key: 'Timestamp', value: new Date(session.id).toLocaleString() });

  // Add messages
  if (session.messages && session.messages.length > 0) {
    session.messages.forEach((msg, index) => {
      flattened.push({ key: `Message ${index + 1} - ${msg.role}`, value: msg.content });
    });
  }

  // Add data
  if (session.data) {
    if (Array.isArray(session.data)) {
      session.data.forEach((item, index) => {
        if (typeof item === 'object') {
          Object.keys(item).forEach(key => {
            flattened.push({ key: `Data ${index + 1} - ${key}`, value: JSON.stringify(item[key]) });
          });
        } else {
          flattened.push({ key: `Data ${index + 1}`, value: item });
        }
      });
    } else {
      flattened.push({ key: 'Data', value: session.data });
    }
  }

  return flattened;
}

function deleteSelectedSession() {
  const select = document.getElementById('sessionSelect');
  if (!select) return;
  const sessionId = select.value;
  if (!sessionId) return;
  chrome.storage.sync.get(['sessions'], (result) => {
    let sessions = result.sessions || [];
    sessions = sessions.filter(s => s.id != sessionId);
    chrome.storage.sync.set({ sessions }, () => {
      loadSessions();
      const container = document.getElementById('sessionContainer');
      if (container) container.style.display = 'none';
      showMessage('Session deleted');
    });
  });
}

function exportSelectedSession() {
  const select = document.getElementById('sessionSelect');
  if (!select) return;
  const sessionId = select.value;
  if (!sessionId) return;
  chrome.storage.sync.get(['sessions'], (result) => {
    const sessions = result.sessions || [];
    const session = sessions.find(s => s.id == sessionId);
    if (session) {
      const dataStr = JSON.stringify(session, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${session.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Session exported');
    }
  });
}

function displaySessionContent() {
  loadSelectedSession();
}

// Make functions global for onclick handlers
window.sortDataTable = sortDataTable;
window.changePage = changePage;
window.sortSessionTable = sortSessionTable;
window.changeSessionPage = changeSessionPage;