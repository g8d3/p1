# Smart Contract Auditing Directory - Data Pipeline

This pipeline monitors for smart contract exploits in real-time, updates auditor ratings dynamically, and ingests data from various sources.

## Features
- **Exploit Detection**: Scrapes Etherscan and Twitter for exploit reports
- **Data Ingestion**: Pulls real-time data from Dune Analytics, Etherscan API, and DefiLlama
- **Rating Updates**: Automatically adjusts auditor scores based on exploit occurrences
- **Real-time Processing**: Uses Node.js queues for handling data volume
- **Logging**: Comprehensive error handling and logging with Winston

## Installation
1. Navigate to the pipeline directory:
   ```bash
   cd s7-audir/pipeline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional, for API keys):
   Create a `.env` file:
   ```
   DUNE_API_KEY=your_dune_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

## Running the Pipeline

### Full Pipeline
```bash
npm start
```
This runs the main orchestrator, which scrapes, ingests, and processes data every hour.

### Individual Components
- Scraping: `npm run scrape`
- Ingestion: `npm run ingest`
- Processing: `npm run process`

### Manual Run
For testing, the pipeline runs once on start, then schedules hourly.

## Architecture
- **Scrapers**: `scrapers/` - Puppeteer-based web scraping
- **Ingestion**: `ingestion/` - API integrations
- **Processing**: `processing/` - Rating calculations and updates
- **Logs**: `logs/` - Winston logs for monitoring

## Monitoring UI
Access the simple monitoring UI at `http://localhost:3000` when running the pipeline.
- Home: Basic status
- /logs: Log viewer (placeholder)

## Extensibility
- Add new scrapers by extending `BaseScraper`
- Add new APIs in `ingestion/`
- Customize rating logic in `RatingUpdater`

## Challenges Addressed
- API rate limits: Error handling and retries
- Scraping ethics: Targeted selectors, no aggressive scraping
- False positives: Structured data processing
- Real-time volume: Queue-based processing

## Next Steps
- Integrate with database for persistent ratings
- Add webhooks for real-time alerts
- Implement ML for better exploit detection