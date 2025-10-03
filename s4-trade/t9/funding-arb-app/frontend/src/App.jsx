import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [rates, setRates] = useState({});
  const [arbitrage, setArbitrage] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/funding-rates')
      .then(res => res.json())
      .then(data => {
        setRates(data);
        setLoading(false);
      })
      .catch(err => console.error(err));

    fetch('http://localhost:5000/api/arbitrage')
      .then(res => res.json())
      .then(data => setArbitrage(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="App">
      <h1>Perp DEX Funding Rate Arbitrage</h1>
      {loading ? <p>Loading...</p> : (
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
        </>
      )}
    </div>
  )
}

export default App
