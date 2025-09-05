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

class DefiLlamaAPI {
  constructor() {
    this.baseUrl = 'https://api.llama.fi';
  }

  async fetchProtocols() {
    try {
      const response = await axios.get(`${this.baseUrl}/protocols`);
      const protocols = response.data;
      logger.info(`Fetched ${protocols.length} protocols from DefiLlama`);
      return protocols.map(protocol => ({
        source: 'DefiLlama',
        name: protocol.name,
        tvl: protocol.tvl,
        timestamp: new Date()
      }));
    } catch (error) {
      logger.error(`Error fetching from DefiLlama: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DefiLlamaAPI;