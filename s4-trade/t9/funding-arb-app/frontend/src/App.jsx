import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [rates, setRates] = useState({});
  const [arbitrage, setArbitrage] = useState({});
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState({ rates: false, arbitrage: false, config: false });
  const [error, setError] = useState(null);
  const [mappings, setMappings] = useState({});
  const [newMapping, setNewMapping] = useState({ name: '', query: '' });
  const [newDex, setNewDex] = useState({ name: '', baseUrl: '', fundingEndpoint: '', marketEndpoint: '', enabled: true, responseMapping: 'default' });

  const renderData = (data) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0]);
      return (
        <table>
          <thead>
            <tr>
              {headers.map(header => <th key={header}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {headers.map(header => <td key={header}>{JSON.stringify(row[header])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (typeof data === 'object' && data !== null) {
      // If object, try to find arrays inside
      const arrays = Object.entries(data).filter(([key, value]) => Array.isArray(value) && value.length > 0 && typeof value[0] === 'object');
      if (arrays.length > 0) {
        return arrays.map(([key, value]) => (
          <div key={key}>
            <h4>{key}</h4>
            {renderData(value)}
          </div>
        ));
      }
    }
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
  };

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

  const fetchConfig = async () => {
    setLoading(prev => ({ ...prev, config: true }));
    try {
      const configRes = await fetch('/api/config');
      if (!configRes.ok) {
        throw new Error(`Failed to fetch config: ${configRes.status} ${configRes.statusText}`);
      }
      const configData = await configRes.json();
      setConfig(configData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, config: false }));
    }
  };

  const fetchRates = async () => {
    setLoading(prev => ({ ...prev, rates: true }));
    try {
      const ratesRes = await fetch('/api/funding-rates');
      if (!ratesRes.ok) {
        throw new Error(`Failed to fetch funding rates: ${ratesRes.status} ${ratesRes.statusText}`);
      }
      const ratesData = await ratesRes.json();
      setRates(ratesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, rates: false }));
    }
  };

  const fetchArbitrage = async () => {
    setLoading(prev => ({ ...prev, arbitrage: true }));
    try {
      const arbRes = await fetch('/api/arbitrage');
      if (!arbRes.ok) {
        throw new Error(`Failed to fetch arbitrage: ${arbRes.status} ${arbRes.statusText}`);
      }
      const arbData = await arbRes.json();
      setArbitrage(arbData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, arbitrage: false }));
    }
  };

  const fetchMappings = async () => {
    try {
      const res = await fetch('/api/mappings');
      if (!res.ok) {
        throw new Error(`Failed to fetch mappings: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setMappings(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateMappings = async (newMappings) => {
    setMappings(newMappings);
    try {
      const res = await fetch('/api/mappings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMappings),
      });
      if (!res.ok) {
        throw new Error(`Failed to update mappings: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchMappings();
  }, []);

  return (
    <div className="App">
      <h1>Perp DEX Funding Rate Arbitrage</h1>
      {error && (
        <div style={{ color: 'red', fontSize: '18px', fontWeight: 'bold', margin: '20px 0' }}>
          <h2>Error:</h2>
          <pre>{error}</pre>
        </div>
      )}
      <h2>Funding Rates {loading.rates && <span>(Loading...)</span>}</h2>
      <button onClick={fetchRates} disabled={loading.rates}>Fetch Funding Rates</button>
      {Object.keys(rates).length > 0 && (
        <div>
          {Object.entries(rates).map(([dex, data]) => (
            <div key={dex} style={{ marginBottom: '20px' }}>
              <h3>{dex.toUpperCase()}</h3>
              {renderData(data)}
            </div>
          ))}
        </div>
      )}

      <h2>Arbitrage Opportunities {loading.arbitrage && <span>(Loading...)</span>}</h2>
      <button onClick={fetchArbitrage} disabled={loading.arbitrage}>Fetch Arbitrage</button>
      {Object.keys(arbitrage).length > 0 && (
        <div>
          {renderData(arbitrage)}
        </div>
      )}

          <h2>Data Sources {loading.config && <span>(Loading...)</span>}</h2>
          <div>
            <button onClick={fetchConfig} disabled={loading.config}>Refresh Config</button>
            <button onClick={() => {
              const dataStr = JSON.stringify(config, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = 'dex-config.json';
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}>Export Config</button>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    try {
                      const importedConfig = JSON.parse(e.target.result);
                      updateConfig(importedConfig);
                    } catch (err) {
                      setError('Invalid JSON file');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <p>Manage DEX data sources:</p>
            <table>
              <thead>
                <tr>
                  <th>DEX</th>
                  <th>Base URL</th>
                  <th>Funding Endpoint</th>
                  <th>Market Endpoint</th>
                  <th>Response Mapping (jq)</th>
                  <th>Enabled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(config).map(([dex, details]) => (
                  <tr key={dex}>
                    <td>{dex.toUpperCase()}</td>
                    <td><input
                      type="text"
                      value={details.baseUrl || ''}
                      onChange={(e) => handleEditDex(dex, 'baseUrl', e.target.value)}
                    /></td>
                    <td><input
                      type="text"
                      value={details.fundingEndpoint || ''}
                      onChange={(e) => handleEditDex(dex, 'fundingEndpoint', e.target.value)}
                    /></td>
                    <td><input
                      type="text"
                      value={details.marketEndpoint || ''}
                      onChange={(e) => handleEditDex(dex, 'marketEndpoint', e.target.value)}
                    /></td>
                    <td><select
                      value={details.responseMapping || 'default'}
                      onChange={(e) => handleEditDex(dex, 'responseMapping', e.target.value)}
                    >
                      {Object.keys(mappings).map(mapping => (
                        <option key={mapping} value={mapping}>{mapping}: {mappings[mapping]}</option>
                      ))}
                    </select></td>
                    <td><input
                      type="checkbox"
                      checked={details.enabled || false}
                      onChange={(e) => handleEditDex(dex, 'enabled', e.target.checked)}
                    /></td>
                    <td><button onClick={() => handleDeleteDex(dex)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              Response Mapping: <select
                value={newDex.responseMapping}
                onChange={(e) => setNewDex({ ...newDex, responseMapping: e.target.value })}
              >
                {Object.keys(mappings).map(mapping => (
                  <option key={mapping} value={mapping}>{mapping}: {mappings[mapping]}</option>
                ))}
              </select>
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
            <h3>Response Mappings</h3>
            <ul>
              {Object.entries(mappings).map(([name, query]) => (
                <li key={name}>
                  <strong>{name}</strong>: {query}
                  <button onClick={() => {
                    const newMappings = { ...mappings };
                    delete newMappings[name];
                    updateMappings(newMappings);
                  }}>Delete</button>
                </li>
              ))}
            </ul>
            <div>
              Name: <input
                type="text"
                value={newMapping.name}
                onChange={(e) => setNewMapping({ ...newMapping, name: e.target.value })}
              />
              Query: <input
                type="text"
                value={newMapping.query}
                onChange={(e) => setNewMapping({ ...newMapping, query: e.target.value })}
                placeholder="e.g. .data[]"
              />
              <button onClick={() => {
                if (newMapping.name && newMapping.query) {
                  updateMappings({ ...mappings, [newMapping.name]: newMapping.query });
                  setNewMapping({ name: '', query: '' });
                }
              }}>Add Mapping</button>
             </div>
           </div>
     </div>
  )
}

export default App
