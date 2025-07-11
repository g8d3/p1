const express = require('express');
const db = require('./db');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(bodyParser.json());

// GET /api/tokens - Fetches a list of all tokens
app.get('/api/tokens', (req, res) => {
  // This is a placeholder. In a real implementation, you would fetch data 
  // from the blockchain or a cached source.
  res.json({ tokens: [] });
});

// GET /api/tokens/:address - Fetches detailed information for a specific token
app.get('/api/tokens/:address', (req, res) => {
  const { address } = req.params;
  // This is a placeholder. In a real implementation, you would fetch data 
  // for the specific token.
  res.json({ token: { address, name: 'Placeholder Token', symbol: 'PLC' } });
});

// GET /api/config - Retrieves the current application configuration
app.get('/api/config', (req, res) => {
  db.all("SELECT key, value FROM configuration", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const config = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(config);
  });
});

// POST /admin/api/login - Authenticates an administrator
app.post('/admin/api/login', (req, res) => {
  // This is a placeholder for authentication.
  // In a real application, you would validate credentials.
  res.json({ success: true, message: 'Logged in successfully' });
});

// GET /admin/api/config - Retrieves the configuration for the admin interface
app.get('/admin/api/config', (req, res) => {
  db.all("SELECT key, value FROM configuration", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /admin/api/config - Updates the application configuration
app.post('/admin/api/config', (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Key and value are required' });
  }

  const stmt = db.prepare("UPDATE configuration SET value = ? WHERE key = ?");
  stmt.run(value, key, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
        // If no rows were updated, it means the key doesn't exist.
        // You might want to insert it instead.
        const insertStmt = db.prepare("INSERT INTO configuration (key, value) VALUES (?, ?)");
        insertStmt.run(key, value, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Configuration inserted successfully' });
        });
        insertStmt.finalize();
    } else {
        res.json({ success: true, message: 'Configuration updated successfully' });
    }
  });
  stmt.finalize();
});


app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});