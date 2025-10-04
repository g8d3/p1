import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [rates, setRates] = useState({});
  const [arbitrage, setArbitrage] = useState({});
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDex, setNewDex] = useState({ name: '', baseUrl: '', fundingEndpoint: '', marketEndpoint: '', enabled: true });

  const updateConfig = async (newConfig) => {
    setConfig(newConfig);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) {
        throw new Error(`Failed to update config: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddDex = () => {
    if (!newDex.name || !newDex.baseUrl) return;
    const updatedConfig = { ...config, [newDex.name.toLowerCase()]: { ...newDex, name: undefined } };
    updateConfig(updatedConfig);
    setNewDex({ name: '', baseUrl: '', fundingEndpoint: '', marketEndpoint: '', enabled: true });
  };

  const handleDeleteDex = (dex) => {
    const updatedConfig = { ...config };
    delete updatedConfig[dex];
    updateConfig(updatedConfig);
  };

  const handleEditDex = (dex, field, value) => {
    const updatedConfig = { ...config, [dex]: { ...config[dex], [field]: value } };
    updateConfig(updatedConfig);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configRes = await fetch('/api/config');
        if (!configRes.ok) {
          throw new Error(`Failed to fetch config: ${configRes.status} ${configRes.statusText}`);
        }
        const configData = await configRes.json();
        setConfig(configData);

        const ratesRes = await fetch('/api/funding-rates');
        if (!ratesRes.ok) {
          throw new Error(`Failed to fetch funding rates: ${ratesRes.status} ${ratesRes.statusText}`);
        }
        const ratesData = await ratesRes.json();
        setRates(ratesData);

        const arbRes = await fetch('/api/arbitrage');
        if (!arbRes.ok) {
          throw new Error(`Failed to fetch arbitrage: ${arbRes.status} ${arbRes.statusText}`);
        }
        const arbData = await arbRes.json();
        setArbitrage(arbData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <h1>Perp DEX Funding Rate Arbitrage</h1>
      {error ? (
        <div style={{ color: 'red', fontSize: '18px', fontWeight: 'bold', margin: '20px 0' }}>
          <h2>Error:</h2>
          <pre>{error}</pre>
        </div>
      ) : loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>Funding Rates</h2>
          <table>
            <thead>
              <tr>
                <th>DEX</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rates).map(([dex, data]) => (
                <tr key={dex}>
                  <td>{dex.toUpperCase()}</td>
                  <td><pre>{JSON.stringify(data, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Arbitrage Opportunities</h2>
          <div>
            {Object.keys(arbitrage).length > 0 ? (
              <pre>{JSON.stringify(arbitrage, null, 2)}</pre>
            ) : (
              <p>No opportunities found</p>
            )}
          </div>

          <h2>Data Sources</h2>
          <div>
            <p>Manage DEX data sources:</p>
            <ul>
              {Object.entries(config).map(([dex, details]) => (
                <li key={dex} style={{ marginBottom: '10px' }}>
                  <strong>{dex.toUpperCase()}</strong>
                  <br />
                  Base URL: <input
                    type="text"
                    value={details.baseUrl}
                    onChange={(e) => handleEditDex(dex, 'baseUrl', e.target.value)}
                  />
                  <br />
                  Funding Endpoint: <input
                    type="text"
                    value={details.fundingEndpoint}
                    onChange={(e) => handleEditDex(dex, 'fundingEndpoint', e.target.value)}
                  />
                  <br />
                  Market Endpoint: <input
                    type="text"
                    value={details.marketEndpoint}
                    onChange={(e) => handleEditDex(dex, 'marketEndpoint', e.target.value)}
                  />
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      checked={details.enabled}
                      onChange={(e) => handleEditDex(dex, 'enabled', e.target.checked)}
                    />
                    Enabled
                  </label>
                  <button onClick={() => handleDeleteDex(dex)}>Delete</button>
                </li>
              ))}
            </ul>
            <h3>Add New DEX</h3>
            <div>
              Name: <input
                type="text"
                value={newDex.name}
                onChange={(e) => setNewDex({ ...newDex, name: e.target.value })}
              />
              <br />
              Base URL: <input
                type="text"
                value={newDex.baseUrl}
                onChange={(e) => setNewDex({ ...newDex, baseUrl: e.target.value })}
              />
              <br />
              Funding Endpoint: <input
                type="text"
                value={newDex.fundingEndpoint}
                onChange={(e) => setNewDex({ ...newDex, fundingEndpoint: e.target.value })}
              />
              <br />
              Market Endpoint: <input
                type="text"
                value={newDex.marketEndpoint}
                onChange={(e) => setNewDex({ ...newDex, marketEndpoint: e.target.value })}
              />
              <br />
              <label>
                <input
                  type="checkbox"
                  checked={newDex.enabled}
                  onChange={(e) => setNewDex({ ...newDex, enabled: e.target.checked })}
                />
                Enabled
              </label>
              <br />
              <button onClick={handleAddDex}>Add DEX</button>
            </div>
            <p>Changes are applied immediately to the backend.</p>
          </div>
        </>
      )}
    </div>
  )
}

export default App
