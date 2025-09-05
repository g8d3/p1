const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '../logs/ingestion.log' })
  ]
});

class DuneIngestion {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.dune.com/api/v1';
  }

  async fetchExploitData(queryId) {
    try {
      const response = await axios.get(`${this.baseUrl}/query/${queryId}/results`, {
        headers: {
          'X-Dune-API-Key': this.apiKey
        }
      });
      const data = response.data.result.rows;
      logger.info(`Fetched ${data.length} rows from Dune`);
      return data.map(row => ({
        source: 'Dune',
        contract: row.contract_address,
        exploit: row.exploit_description,
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      logger.error(`Error fetching from Dune: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DuneIngestion;