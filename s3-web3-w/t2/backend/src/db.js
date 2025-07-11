const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create the configuration table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`);

  // Insert default configuration data if the table is empty
  const stmt = db.prepare("INSERT OR IGNORE INTO configuration (key, value) VALUES (?, ?)");
  const defaultConfig = [
    { key: 'fee_recipient', value: '0x0000000000000000000000000000000000000000' },
    { key: 'trading_fee_bps', value: '100' },
    { key: 'rpc_url', value: 'https://mainnet.base.org' },
    { key: 'site_title', value: 'My Pump Clone' }
  ];

  defaultConfig.forEach(item => {
    stmt.run(item.key, item.value);
  });

  stmt.finalize();
});

module.exports = db;