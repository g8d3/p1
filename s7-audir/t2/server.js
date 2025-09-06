const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { readData, writeData } = require('./database');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables for API keys (in production, use proper env vars)
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || 'demo_token';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'demo_token';
const IMMUNEFI_API_KEY = process.env.IMMUNEFI_API_KEY || 'demo_token';

// Mock data based on the CryptoGuard specification
const exploits = [
  {
    id: '1',
    title: 'Reentrancy Attack on Yield Protocol',
    category: 'Smart Contract',
    subcategory: 'Reentrancy',
    severity: 'Critical',
    date: '2024-01-15',
    protocols: ['Uniswap', 'Compound'],
    financialImpact: '$2.1M',
    description: 'Attacker exploited reentrancy vulnerability in yield farming contract to drain liquidity pool.',
    tags: ['reentrancy', 'yield-farming', 'liquidity-pool'],
    technical_details: {
      attack_vector: 'External contract call during state update',
      root_cause: 'Missing reentrancy guard on external call',
      code_examples: {
        vulnerable: `function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount;
}`,
        fixed: `function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
}`
      }
    }
  },
  {
    id: '2',
    title: 'Oracle Price Manipulation via Flash Loans',
    category: 'Economic',
    subcategory: 'Oracle Manipulation',
    severity: 'High',
    date: '2024-01-12',
    protocols: ['Chainlink', 'Aave'],
    financialImpact: '$1.8M',
    description: 'Flash loan attack manipulated oracle prices to liquidate undercollateralized positions.',
    tags: ['oracle', 'flash-loan', 'liquidation']
  }
];

const categories = [
  {
    id: 'smart-contract',
    name: 'Smart Contract Vulnerabilities',
    description: 'Logic errors, access control issues, and implementation flaws',
    subcategories: [
      'Reentrancy (SWC-107)',
      'Integer Overflow/Underflow (SWC-101)',
      'Access Control Issues (SWC-105)',
      'Unhandled Exceptions (SWC-104)',
      'Race Conditions (SWC-114)'
    ],
    exploitCount: 342
  },
  {
    id: 'economic',
    name: 'Economic Exploits',
    description: 'Price manipulation, flash loans, and incentive misalignment',
    subcategories: [
      'Price Oracle Manipulation',
      'Flash Loan Attacks',
      'MEV Extraction',
      'Liquidity Pool Manipulation',
      'Governance Token Attacks'
    ],
    exploitCount: 198
  }
];

// API Routes
app.get('/api/exploits', (req, res) => {
  try {
    const { category, search } = req.query;
    const data = readData();
    let exploits = data.exploits || [];

    if (category && category !== 'all') {
      exploits = exploits.filter(exploit => exploit.category === category);
    }

    if (search) {
      exploits = exploits.filter(exploit =>
        exploit.title.toLowerCase().includes(search.toLowerCase()) ||
        exploit.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json(exploits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exploits' });
  }
});

app.get('/api/exploits/:id', (req, res) => {
  try {
    const data = readData();
    const exploit = data.exploits.find(e => e.id === parseInt(req.params.id));
    if (exploit) {
      res.json(exploit);
    } else {
      res.status(404).json({ message: 'Exploit not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exploit' });
  }
});

// Create new exploit
app.post('/api/exploits', (req, res) => {
  try {
    const data = readData();
    const newExploit = {
      id: Math.max(...data.exploits.map(e => e.id), 0) + 1,
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'published'
    };

    data.exploits.push(newExploit);
    writeData(data);

    res.json({ id: newExploit.id, message: 'Exploit created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exploit' });
  }
});

// Update exploit
app.put('/api/exploits/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.exploits.findIndex(e => e.id === parseInt(req.params.id));

    if (index !== -1) {
      data.exploits[index] = {
        ...data.exploits[index],
        ...req.body,
        updated_at: new Date().toISOString()
      };
      writeData(data);
      res.json({ message: 'Exploit updated successfully' });
    } else {
      res.status(404).json({ message: 'Exploit not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update exploit' });
  }
});

// Delete exploit
app.delete('/api/exploits/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.exploits.findIndex(e => e.id === parseInt(req.params.id));

    if (index !== -1) {
      data.exploits.splice(index, 1);
      writeData(data);
      res.json({ message: 'Exploit deleted successfully' });
    } else {
      res.status(404).json({ message: 'Exploit not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exploit' });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    const data = readData();
    res.json(data.categories || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const data = readData();
    const exploits = data.exploits || [];

    const severityBreakdown = {
      critical: exploits.filter(e => e.severity === 'Critical').length,
      high: exploits.filter(e => e.severity === 'High').length,
      medium: exploits.filter(e => e.severity === 'Medium').length,
      low: exploits.filter(e => e.severity === 'Low').length
    };

    res.json({
      totalExploits: exploits.length,
      categoriesCount: (data.categories || []).length,
      recentExploits: exploits.slice(0, 3),
      severityBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Data Source APIs

// Twitter/X API Integration
app.get('/api/sources/twitter/search', async (req, res) => {
  try {
    const query = req.query.q || 'DeFi exploit OR smart contract vulnerability';
    const maxResults = req.query.max || 10;

    // Mock Twitter API response (in production, use real Twitter API v2)
    const mockTweets = [
      {
        id: '1',
        text: '🚨 Critical vulnerability discovered in @Uniswap V3 pool. Reentrancy attack possible. More details coming soon. #DeFi #Security',
        author: 'DeFiSecurity',
        created_at: new Date().toISOString(),
        retweet_count: 245,
        like_count: 89
      },
      {
        id: '2',
        text: 'New exploit in @Compound protocol allowing flash loan manipulation. Users should exercise caution. #DeFi #FlashLoan',
        author: 'BlockSecTeam',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        retweet_count: 156,
        like_count: 67
      }
    ];

    res.json({
      data: mockTweets.slice(0, maxResults),
      meta: { count: mockTweets.length, query }
    });
  } catch (error) {
    res.status(500).json({ error: 'Twitter API error', details: error.message });
  }
});

// GitHub API Integration
app.get('/api/sources/github/search', async (req, res) => {
  try {
    const query = req.query.q || 'DeFi exploit OR smart contract vulnerability';
    const sort = req.query.sort || 'updated';

    // Mock GitHub API response
    const mockRepos = [
      {
        id: 1,
        name: 'defi-security-tools',
        full_name: 'cryptoguard/defi-security-tools',
        description: 'Security tools and analysis for DeFi protocols',
        html_url: 'https://github.com/cryptoguard/defi-security-tools',
        updated_at: new Date().toISOString(),
        language: 'Solidity',
        stargazers_count: 234,
        forks_count: 45
      },
      {
        id: 2,
        name: 'exploit-poc',
        full_name: 'security-research/exploit-poc',
        description: 'Proof of concept for recent DeFi exploits',
        html_url: 'https://github.com/security-research/exploit-poc',
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        language: 'JavaScript',
        stargazers_count: 89,
        forks_count: 23
      }
    ];

    res.json({
      items: mockRepos,
      total_count: mockRepos.length
    });
  } catch (error) {
    res.status(500).json({ error: 'GitHub API error', details: error.message });
  }
});

// Immunefi API Integration
app.get('/api/sources/immunefi/bounties', async (req, res) => {
  try {
    // Mock Immunefi API response
    const mockBounties = [
      {
        id: '1',
        title: 'Critical Reentrancy Vulnerability',
        project: 'Uniswap V3',
        severity: 'Critical',
        bounty: 50000,
        status: 'open',
        submitted_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Oracle Price Manipulation',
        project: 'Chainlink',
        severity: 'High',
        bounty: 25000,
        status: 'resolved',
        submitted_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.json({
      bounties: mockBounties,
      total: mockBounties.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Immunefi API error', details: error.message });
  }
});

// Code4rena API Integration
app.get('/api/sources/code4rena/contests', async (req, res) => {
  try {
    const mockContests = [
      {
        id: '1',
        title: 'DeFi Protocol Security Audit',
        sponsor: 'DeFi Protocol',
        prizePool: 75000,
        status: 'active',
        endDate: new Date(Date.now() + 604800000).toISOString(),
        findings: 23
      },
      {
        id: '2',
        title: 'Lending Platform Audit',
        sponsor: 'Lending Protocol',
        prizePool: 50000,
        status: 'upcoming',
        endDate: new Date(Date.now() + 1209600000).toISOString(),
        findings: 0
      }
    ];

    res.json({
      contests: mockContests,
      active: mockContests.filter(c => c.status === 'active').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Code4rena API error', details: error.message });
  }
});

// Blockchain Data Integration
app.get('/api/sources/blockchain/transactions', async (req, res) => {
  try {
    const address = req.query.address || '0x1234567890123456789012345678901234567890';

    // Mock blockchain transaction data
    const mockTransactions = [
      {
        hash: '0xabc123...',
        from: '0x1234567890123456789012345678901234567890',
        to: '0xdef4567890123456789012345678901234567890',
        value: '1000000000000000000', // 1 ETH
        timestamp: new Date().toISOString(),
        suspicious: true,
        reason: 'Large transfer to new contract'
      },
      {
        hash: '0xdef789...',
        from: '0x4567890123456789012345678901234567890123',
        to: '0x7890123456789012345678901234567890123456',
        value: '5000000000000000000', // 5 ETH
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        suspicious: false
      }
    ];

    res.json({
      address,
      transactions: mockTransactions,
      total: mockTransactions.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Blockchain API error', details: error.message });
  }
});

// Data Sources Management
app.get('/api/sources/status', (req, res) => {
  try {
    const data = readData();
    const sources = data.data_sources || [];
    const totalItems = sources.reduce((sum, source) => sum + source.items_collected, 0);
    const activeSources = sources.filter(s => s.status === 'active').length;

    res.json({
      sources: sources.map(source => ({
        name: source.name,
        status: source.status,
        lastRun: source.last_run,
        itemsCollected: source.items_collected,
        errorRate: 0.02 // Mock error rate
      })),
      overall: {
        totalSources: sources.length,
        activeSources,
        totalItemsCollected: totalItems,
        averageErrorRate: 0.04
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data sources status' });
  }
});

// Update data source status
app.put('/api/sources/:id/status', (req, res) => {
  try {
    const data = readData();
    const { status } = req.body;
    const sourceIndex = data.data_sources.findIndex(s => s.id === parseInt(req.params.id));

    if (sourceIndex !== -1) {
      data.data_sources[sourceIndex].status = status;
      writeData(data);
      res.json({ message: 'Data source status updated successfully' });
    } else {
      res.status(404).json({ message: 'Data source not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update data source status' });
  }
});

// Run data source collection
app.post('/api/sources/:id/run', async (req, res) => {
  try {
    const data = readData();
    const sourceIndex = data.data_sources.findIndex(s => s.id === parseInt(req.params.id));

    if (sourceIndex === -1) {
      return res.status(404).json({ message: 'Data source not found' });
    }

    // Simulate data collection
    const itemsCollected = Math.floor(Math.random() * 50) + 1;
    data.data_sources[sourceIndex].items_collected += itemsCollected;
    data.data_sources[sourceIndex].last_run = new Date().toISOString();
    writeData(data);

    res.json({
      message: 'Data collection completed',
      itemsCollected,
      sourceId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run data collection' });
  }
});

// Moderation Queue
app.get('/api/moderation', (req, res) => {
  try {
    const data = readData();
    res.json(data.moderation_queue || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// Update moderation status
app.put('/api/moderation/:id', (req, res) => {
  try {
    const data = readData();
    const { status, reviewed_by } = req.body;
    const itemIndex = data.moderation_queue.findIndex(item => item.id === parseInt(req.params.id));

    if (itemIndex !== -1) {
      data.moderation_queue[itemIndex].status = status;
      data.moderation_queue[itemIndex].reviewed_by = reviewed_by;
      data.moderation_queue[itemIndex].reviewed_at = new Date().toISOString();
      writeData(data);
      res.json({ message: 'Moderation status updated successfully' });
    } else {
      res.status(404).json({ message: 'Moderation item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update moderation status' });
  }
});

// Submit content for moderation
app.post('/api/moderation', (req, res) => {
  try {
    const data = readData();
    const newItem = {
      id: Math.max(...data.moderation_queue.map(item => item.id), 0) + 1,
      ...req.body,
      submitted_at: new Date().toISOString(),
      status: 'pending'
    };

    data.moderation_queue.push(newItem);
    writeData(data);

    res.json({ id: newItem.id, message: 'Content submitted for moderation' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit content for moderation' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CryptoGuard API server running on port ${PORT}`);
});