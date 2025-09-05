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

class EtherscanAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.etherscan.io/api';
  }

  async fetchContractData(address) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: address,
          apikey: this.apiKey
        }
      });
      const data = response.data.result[0];
      logger.info(`Fetched contract data for ${address}`);
      return {
        source: 'Etherscan API',
        contract: address,
        code: data.SourceCode,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error fetching from Etherscan API: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EtherscanAPI;