const DuneIngestion = require('./dune-ingestion');
const EtherscanAPI = require('./etherscan-api');
const DefiLlamaAPI = require('./defillama-api');

async function runIngestion() {
  const dune = new DuneIngestion(process.env.DUNE_API_KEY);
  const etherscan = new EtherscanAPI(process.env.ETHERSCAN_API_KEY);
  const defillama = new DefiLlamaAPI();

  const allData = [];

  try {
    // Example: Fetch from Dune (need queryId)
    // const duneData = await dune.fetchExploitData('queryId');
    // allData.push(...duneData);

    // Fetch from DefiLlama
    const protocols = await defillama.fetchProtocols();
    allData.push(...protocols);

    // Example for Etherscan: fetch for a specific address
    // const contractData = await etherscan.fetchContractData('0x...');
    // allData.push(contractData);

  } catch (error) {
    console.error(`Error in ingestion: ${error.message}`);
  }

  return allData;
}

module.exports = { runIngestion };