const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const jq = require('node-jq');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

const PORT = process.env.PORT || 5000;

// Mappings
let mappings = { default: '', array: '.[]', data: '.data' };

// DEX configurations
const dexes = {
  hyperliquid: {
    baseUrl: 'https://api.hyperliquid.xyz',
    fundingEndpoint: '/info',
    marketEndpoint: '/info',
    enabled: true
  },
  lighter: {
    wsUrl: 'wss://mainnet.zklighter.elliot.ai/stream',
    subscribeMessage: JSON.stringify({"type": "subscribe", "channel": "market_stats/all"}),
    enabled: true
  },
  paradex: {
    baseUrl: 'https://api.prod.paradex.trade',
    fundingEndpoint: '/v1/markets/summary',
    marketEndpoint: '/v1/markets/summary',
    enabled: true
  },
  jupiter: {
    baseUrl: 'https://api.jup.ag',
    fundingEndpoint: '/v1/funding-rates',
    marketEndpoint: '/price',
    enabled: false // No perpetual futures support
  },
  aster: {
    baseUrl: 'https://www.asterdex.com',
    fundingEndpoint: '/fapi/v1/premiumIndex',
    marketEndpoint: '/fapi/v1/premiumIndex',
    enabled: true
  },
  edgex: {
    baseUrl: 'https://pro.edgex.exchange',
    fundingEndpoint: '/api/v1/public/meta/getMetaData',
    marketEndpoint: '/api/v1/public/meta/getMetaData',
    enabled: true
  },
  pacifica: {
    baseUrl: 'https://api.pacifica.fi',
    fundingEndpoint: '/api/v1/info',
    marketEndpoint: '/api/v1/info',
    enabled: true
  },
  apex: {
    baseUrl: 'https://omni.apex.exchange',
    fundingEndpoint: '/api/v3/funding',
    marketEndpoint: '/api/v3/funding',
    enabled: true
  },
  aden: {
    baseUrl: 'https://api.orderly.org',
    fundingEndpoint: '/v1/public/funding_rates',
    marketEndpoint: '/v1/public/funding_rates',
    enabled: true
  }
};

// Function to fetch funding rates
async function fetchFundingRates(dex) {
  try {
    const config = dexes[dex];
    if (!config) return null;

    let response;
    if (dex === 'hyperliquid') {
      response = await axios.post(`${config.baseUrl}${config.fundingEndpoint}`, {
        type: 'fundingHistory',
        startTime: Date.now() - 24 * 60 * 60 * 1000, // last 24h
        endTime: Date.now()
      });
    } else if (dex === 'lighter') {
      // WebSocket connection for Lighter
      response = await new Promise((resolve, reject) => {
        const ws = new WebSocket(config.wsUrl);
        let dataReceived = false;

        ws.on('open', () => {
          ws.send(config.subscribeMessage);
        });

        ws.on('message', (data) => {
          try {
            const parsedData = JSON.parse(data.toString());
            if (!dataReceived) {
              dataReceived = true;
              ws.close();
              resolve(parsedData);
            }
          } catch (err) {
            console.error('Error parsing Lighter WebSocket data:', err);
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!dataReceived) {
            ws.close();
            reject(new Error('Timeout waiting for Lighter data'));
          }
        }, 10000);
      });
    } else if (dex === 'jupiter') {
      response = await axios.get(`${config.baseUrl}${config.fundingEndpoint}`);
    } else {
      response = await axios.get(`${config.baseUrl}${config.fundingEndpoint}`);
    }

    let data = response.data || response;

    // Apply jq mapping if present
    const mappingQuery = mappings[config.responseMapping] || config.responseMapping;
    if (mappingQuery) {
      try {
        data = await jq.json(data, mappingQuery);
      } catch (jqError) {
        console.error(`Error applying jq mapping for ${dex}:`, jqError.message);
        // Return original data if jq fails
      }
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${dex} funding rates:`, error.message);
    return null;
  }
}

// Endpoint to get all funding rates
app.get('/api/funding-rates', async (req, res) => {
  const results = {};
  for (const dex of Object.keys(dexes)) {
    if (dexes[dex].enabled) {
      results[dex] = await fetchFundingRates(dex);
    }
  }
  res.json(results);
});

// Endpoint for arbitrage opportunities
app.get('/api/arbitrage', async (req, res) => {
  const rates = {};
  for (const dex of Object.keys(dexes)) {
    if (dexes[dex].enabled) {
      rates[dex] = await fetchFundingRates(dex);
    }
  }

  // Simple arbitrage logic: find max and min rates per asset
  const opportunities = {};
  // Assume assets like BTC, ETH
  // This is placeholder; need to parse actual data
  res.json({ opportunities, rawRates: rates });
});

// Endpoint to get current DEX configurations
app.get('/api/config', (req, res) => {
  res.json(dexes);
});

// Endpoint to update DEX configurations (full CRUD)
app.put('/api/config', express.json(), (req, res) => {
  const newDexes = req.body;
  // Replace the entire dexes object
  Object.assign(dexes, newDexes);
  res.json(dexes);
});

// Endpoint to get mappings
app.get('/api/mappings', (req, res) => {
  res.json(mappings);
});

// Endpoint to update mappings
app.put('/api/mappings', express.json(), (req, res) => {
  const newMappings = req.body;
  Object.assign(mappings, newMappings);
  res.json(mappings);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;