const fs = require('fs');
const path = require('path');

// Simple file-based database
const dataPath = path.join(__dirname, 'data.json');

// Initialize data structure
const initData = () => {
  if (!fs.existsSync(dataPath)) {
    const initialData = {
      exploits: [
        {
          id: 1,
          title: 'Reentrancy Attack on Yield Protocol',
          description: 'Attacker exploited reentrancy vulnerability in yield farming contract to drain liquidity pool.',
          category: 'Smart Contract Vulnerabilities',
          subcategory: 'Reentrancy',
          severity: 'Critical',
          protocols_affected: ['Uniswap', 'Compound'],
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
          },
          tags: ['reentrancy', 'yield-farming', 'liquidity-pool'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'published'
        },
        {
          id: 2,
          title: 'Oracle Price Manipulation via Flash Loans',
          description: 'Flash loan attack manipulated oracle prices to liquidate undercollateralized positions.',
          category: 'Economic Exploits',
          subcategory: 'Oracle Manipulation',
          severity: 'High',
          protocols_affected: ['Chainlink', 'Aave'],
          technical_details: {
            attack_vector: 'Flash loan price manipulation',
            root_cause: 'Oracle price manipulation through large temporary positions'
          },
          tags: ['oracle', 'flash-loan', 'liquidation'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'published'
        }
      ],
      data_sources: [
        { id: 1, name: 'Twitter/X API', type: 'api', endpoint: '/api/sources/twitter/search', status: 'active', items_collected: 1247, last_run: new Date().toISOString() },
        { id: 2, name: 'GitHub API', type: 'api', endpoint: '/api/sources/github/search', status: 'active', items_collected: 892, last_run: new Date().toISOString() },
        { id: 3, name: 'Immunefi API', type: 'api', endpoint: '/api/sources/immunefi/bounties', status: 'active', items_collected: 156, last_run: new Date().toISOString() },
        { id: 4, name: 'Code4rena API', type: 'api', endpoint: '/api/sources/code4rena/contests', status: 'active', items_collected: 234, last_run: new Date().toISOString() },
        { id: 5, name: 'Blockchain Monitor', type: 'blockchain', endpoint: '/api/sources/blockchain/transactions', status: 'active', items_collected: 3456, last_run: new Date().toISOString() }
      ],
      moderation_queue: [
        {
          id: 1,
          type: 'exploit',
          title: 'Potential Reentrancy Attack on Lending Protocol',
          content: 'Attacker exploited reentrancy vulnerability by calling withdraw function recursively...',
          submitted_by: 'security_researcher_123',
          submitted_at: new Date().toISOString(),
          status: 'pending',
          severity: 'high',
          tags: ['reentrancy', 'lending', 'flash-loan']
        }
      ],
      categories: [
        {
          id: 1,
          name: 'Smart Contract Vulnerabilities',
          description: 'Logic errors, access control issues, and implementation flaws',
          subcategories: ['Reentrancy (SWC-107)', 'Integer Overflow/Underflow (SWC-101)', 'Access Control Issues (SWC-105)'],
          exploit_count: 2
        },
        {
          id: 2,
          name: 'Economic Exploits',
          description: 'Price manipulation, flash loans, and incentive misalignment',
          subcategories: ['Price Oracle Manipulation', 'Flash Loan Attacks', 'MEV Extraction'],
          exploit_count: 1
        }
      ]
    };
    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
  }
};

// Read data from file
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { exploits: [], data_sources: [], moderation_queue: [], categories: [] };
  }
};

// Write data to file
const writeData = (data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

// Initialize
initData();

// Insert initial data
const insertInitialData = () => {
  // Insert categories
  const categories = [
    {
      name: 'Smart Contract Vulnerabilities',
      description: 'Logic errors, access control issues, and implementation flaws',
      subcategories: JSON.stringify([
        'Reentrancy (SWC-107)',
        'Integer Overflow/Underflow (SWC-101)',
        'Access Control Issues (SWC-105)',
        'Unhandled Exceptions (SWC-104)',
        'Race Conditions (SWC-114)'
      ])
    },
    {
      name: 'Economic Exploits',
      description: 'Price manipulation, flash loans, and incentive misalignment',
      subcategories: JSON.stringify([
        'Price Oracle Manipulation',
        'Flash Loan Attacks',
        'MEV Extraction',
        'Liquidity Pool Manipulation',
        'Governance Token Attacks'
      ])
    },
    {
      name: 'Infrastructure Vulnerabilities',
      description: 'Network, oracle, and third-party service vulnerabilities',
      subcategories: JSON.stringify([
        'Key Management Issues',
        'Frontend/UI Exploits',
        'Oracle/External Data Issues',
        'Network/Node Vulnerabilities',
        'API Manipulation'
      ])
    },
    {
      name: 'Social Engineering & Operational',
      description: 'Phishing, insider threats, and operational security failures',
      subcategories: JSON.stringify([
        'Phishing and Social Engineering',
        'Insider Threats',
        'Operational Security Failures',
        'Regulatory/Legal Exploits',
        'Fake Protocol Launches'
      ])
    }
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, description, subcategories)
    VALUES (?, ?, ?)
  `);

  categories.forEach(cat => {
    insertCategory.run(cat.name, cat.description, cat.subcategories);
  });

  // Insert data sources
  const dataSources = [
    { name: 'Twitter/X API', type: 'api', endpoint: '/api/sources/twitter/search', status: 'active' },
    { name: 'GitHub API', type: 'api', endpoint: '/api/sources/github/search', status: 'active' },
    { name: 'Immunefi API', type: 'api', endpoint: '/api/sources/immunefi/bounties', status: 'active' },
    { name: 'Code4rena API', type: 'api', endpoint: '/api/sources/code4rena/contests', status: 'active' },
    { name: 'Blockchain Monitor', type: 'blockchain', endpoint: '/api/sources/blockchain/transactions', status: 'active' }
  ];

  const insertDataSource = db.prepare(`
    INSERT OR IGNORE INTO data_sources (name, type, endpoint, status)
    VALUES (?, ?, ?, ?)
  `);

  dataSources.forEach(source => {
    insertDataSource.run(source.name, source.type, source.endpoint, source.status);
  });

  // Insert sample exploits
  const sampleExploits = [
    {
      title: 'Reentrancy Attack on Yield Protocol',
      description: 'Attacker exploited reentrancy vulnerability in yield farming contract to drain liquidity pool.',
      category: 'Smart Contract Vulnerabilities',
      subcategory: 'Reentrancy',
      severity: 'Critical',
      protocols_affected: JSON.stringify(['Uniswap', 'Compound']),
      technical_details: JSON.stringify({
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
      }),
      tags: JSON.stringify(['reentrancy', 'yield-farming', 'liquidity-pool'])
    },
    {
      title: 'Oracle Price Manipulation via Flash Loans',
      description: 'Flash loan attack manipulated oracle prices to liquidate undercollateralized positions.',
      category: 'Economic Exploits',
      subcategory: 'Oracle Manipulation',
      severity: 'High',
      protocols_affected: JSON.stringify(['Chainlink', 'Aave']),
      technical_details: JSON.stringify({
        attack_vector: 'Flash loan price manipulation',
        root_cause: 'Oracle price manipulation through large temporary positions'
      }),
      tags: JSON.stringify(['oracle', 'flash-loan', 'liquidation'])
    }
  ];

  const insertExploit = db.prepare(`
    INSERT OR IGNORE INTO exploits
    (title, description, category, subcategory, severity, protocols_affected, technical_details, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleExploits.forEach(exploit => {
    insertExploit.run(
      exploit.title,
      exploit.description,
      exploit.category,
      exploit.subcategory,
      exploit.severity,
      exploit.protocols_affected,
      exploit.technical_details,
      exploit.tags
    );
  });
};

module.exports = {
  readData,
  writeData
};