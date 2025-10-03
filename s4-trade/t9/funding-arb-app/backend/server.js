const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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

// DEX configurations
const dexes = {
  hyperliquid: {
    baseUrl: 'https://api.hyperliquid.xyz',
    fundingEndpoint: '/info',
    marketEndpoint: '/info'
  },
  lighter: {
    baseUrl: 'https://api.lighter.xyz',
    fundingEndpoint: '/funding',
    marketEndpoint: '/markets'
  },
  paradex: {
    baseUrl: 'https://api.paradex.trade',
    fundingEndpoint: '/v1/funding',
    marketEndpoint: '/markets'
  },
  jupiter: {
    baseUrl: 'https://api.jup.ag',
    fundingEndpoint: '/v1/funding-rates',
    marketEndpoint: '/price'
  },
  // Add others as needed
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
    } else if (dex === 'jupiter') {
      response = await axios.get(`${config.baseUrl}${config.fundingEndpoint}`);
    } else {
      response = await axios.get(`${config.baseUrl}${config.fundingEndpoint}`);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching ${dex} funding rates:`, error.message);
    return null;
  }
}

// Endpoint to get all funding rates
app.get('/api/funding-rates', async (req, res) => {
  const results = {};
  for (const dex of Object.keys(dexes)) {
    results[dex] = await fetchFundingRates(dex);
  }
  res.json(results);
});

// Endpoint for arbitrage opportunities
app.get('/api/arbitrage', async (req, res) => {
  const rates = {};
  for (const dex of Object.keys(dexes)) {
    rates[dex] = await fetchFundingRates(dex);
  }

  // Simple arbitrage logic: find max and min rates per asset
  const opportunities = {};
  // Assume assets like BTC, ETH
  // This is placeholder; need to parse actual data
  res.json({ opportunities, rawRates: rates });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;