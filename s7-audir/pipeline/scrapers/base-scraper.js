const puppeteer = require('puppeteer');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '../logs/scraper.log' })
  ]
});

class BaseScraper {
  constructor() {
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({ headless: true });
    logger.info('Browser launched');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }

  async scrape(url, selector) {
    try {
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const data = await page.$$eval(selector, elements => elements.map(el => el.textContent));
      await page.close();
      return data;
    } catch (error) {
      logger.error(`Error scraping ${url}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BaseScraper;