const cron = require('node-cron');
const async = require('async');
const express = require('express');
const { runScrapers } = require('./scrapers');
const { runIngestion } = require('./ingestion');
const { runProcessing } = require('./processing');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: './logs/pipeline.log' })
  ]
});

// Queue for processing data
const processingQueue = async.queue(async (data) => {
  logger.info('Processing data...');
  await runProcessing(data);
}, 1); // Concurrency 1

// Store latest data
let latestData = [];

// Express app for UI
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Pipeline Monitor</title></head>
    <body>
      <h1>Smart Contract Auditing Directory - Pipeline Monitor</h1>
      <p>Control the pipeline manually.</p>
      <button onclick="runAll()">Run Full Pipeline</button>
      <button onclick="runScrape()">Run Scrapers</button>
      <button onclick="runIngest()">Run Ingestion</button>
      <button onclick="runProcess()">Run Processing</button>
      <br><br>
      <a href="/logs">View Logs</a> | <a href="/data">View Data</a>
      <script>
        async function runAll() { await fetch('/run-all', {method: 'POST'}); alert('Full pipeline started'); }
        async function runScrape() { await fetch('/run-scrape', {method: 'POST'}); alert('Scrapers started'); }
        async function runIngest() { await fetch('/run-ingest', {method: 'POST'}); alert('Ingestion started'); }
        async function runProcess() { await fetch('/run-process', {method: 'POST'}); alert('Processing started'); }
      </script>
    </body>
    </html>
  `);
});

app.get('/logs', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, 'logs', 'pipeline.log');
  let logs = 'No logs available';
  if (fs.existsSync(logFile)) {
    logs = fs.readFileSync(logFile, 'utf8');
  }
  res.send(`
    <html>
    <head><title>Pipeline Logs</title></head>
    <body>
      <h1>Pipeline Logs</h1>
      <pre>${logs}</pre>
      <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.get('/data', (req, res) => {
  res.send(`
    <html>
    <head><title>Pipeline Data</title></head>
    <body>
      <h1>Latest Ingested Data</h1>
      <p>Items: ${latestData.length}</p>
      <pre>${JSON.stringify(latestData.slice(0, 10), null, 2)}</pre>
      <p>Showing first 10 items...</p>
      <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.post('/run-all', async (req, res) => {
  runPipeline();
  res.send('Full pipeline started');
});

app.post('/run-scrape', async (req, res) => {
  const scrapedData = await runScrapers();
  logger.info(`Scraped ${scrapedData.length} items`);
  res.send(`Scraped ${scrapedData.length} items`);
});

app.post('/run-ingest', async (req, res) => {
  const ingestedData = await runIngestion();
  latestData = ingestedData;
  logger.info(`Ingested ${ingestedData.length} items`);
  res.send(`Ingested ${ingestedData.length} items`);
});

app.post('/run-process', async (req, res) => {
  // For process, we need data, perhaps from previous runs or mock
  const mockData = []; // Or get from somewhere
  processingQueue.push(mockData, (err) => {
    if (err) logger.error(`Processing error: ${err.message}`);
    else logger.info('Processing completed');
  });
  res.send('Processing started');
});

app.listen(PORT, () => {
  logger.info(`Monitoring UI available at http://localhost:${PORT}`);
});

async function runPipeline() {
  try {
    logger.info('Starting pipeline run');

    // Scrape data
    const scrapedData = await runScrapers();
    logger.info(`Scraped ${scrapedData.length} items`);

    // Ingest data
    const ingestedData = await runIngestion();
    logger.info(`Ingested ${ingestedData.length} items`);

    // Combine data
    const allData = [...scrapedData, ...ingestedData];

    // Add to processing queue
    processingQueue.push(allData, (err) => {
      if (err) logger.error(`Processing error: ${err.message}`);
      else logger.info('Processing completed');
    });

  } catch (error) {
    logger.error(`Pipeline error: ${error.message}`);
  }
}

logger.info('Pipeline UI started. Use the web interface to run components.');