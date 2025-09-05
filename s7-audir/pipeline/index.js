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

// Express app for UI
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Pipeline Monitor</title></head>
    <body>
      <h1>Smart Contract Auditing Directory - Pipeline Monitor</h1>
      <p>Pipeline is running. Check logs for details.</p>
      <p>Last run: ${new Date().toISOString()}</p>
      <a href="/logs">View Logs</a>
    </body>
    </html>
  `);
});

app.get('/logs', (req, res) => {
  // Simple log viewer
  res.send(`
    <html>
    <head><title>Pipeline Logs</title></head>
    <body>
      <h1>Pipeline Logs</h1>
      <p>Logs are in logs/pipeline.log</p>
      <pre>${'Logs would be displayed here'}</pre>
    </body>
    </html>
  `);
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

// Schedule to run every hour
cron.schedule('0 * * * *', () => {
  runPipeline();
});

logger.info('Pipeline started. Scheduled to run every hour.');

// For testing, run once
runPipeline();