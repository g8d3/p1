// main.js - Crypto Ranking Dashboard (Vanilla JS + Dexie.js)

// IndexedDB setup
const db = new Dexie('crypto_dashboard');
db.version(1).stores({
  configs: 'id',
  rankings: '++id, asset_id, relevance_score',
  passkeys: 'id'
});

// UI rendering (simplified MVP)
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('auth-panel').innerHTML = '<button id="login-btn">Login (Passkey)</button>';
  document.getElementById('config-panel').innerHTML = '<form id="config-form">Assets (comma): <input id="assets" value="bitcoin,ethereum"/> <button>Save</button></form>';
  document.getElementById('ranking-table').innerHTML = '<table><thead><tr><th>Asset</th><th>Score</th><th>24h %</th><th>Volume</th></tr></thead><tbody id="rankings"></tbody></table>';

  // Dummy data for demo
  const demo = [
    { asset_id: 'bitcoin', name: 'Bitcoin', relevance_score: 0.98, price_change_24h: 2.1, volume_24h: 100000000 },
    { asset_id: 'ethereum', name: 'Ethereum', relevance_score: 0.95, price_change_24h: 1.5, volume_24h: 80000000 }
  ];
  renderRankings(demo);
});

function renderRankings(rankings) {
  const tbody = document.getElementById('rankings');
  tbody.innerHTML = rankings.map(r => `<tr><td>${r.name}</td><td>${r.relevance_score}</td><td>${r.price_change_24h}%</td><td>${r.volume_24h}</td></tr>`).join('');
}
