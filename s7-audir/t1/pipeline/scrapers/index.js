const EtherscanScraper = require('./etherscan-scraper');
const TwitterScraper = require('./twitter-scraper');

async function runScrapers() {
  const scrapers = [
    new EtherscanScraper(),
    new TwitterScraper()
  ];

  const allExploits = [];

  for (const scraper of scrapers) {
    try {
      const exploits = await scraper.scrapeExploits();
      allExploits.push(...exploits);
    } catch (error) {
      console.error(`Error in ${scraper.constructor.name}: ${error.message}`);
    }
  }

  return allExploits;
}

module.exports = { runScrapers };