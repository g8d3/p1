const RatingUpdater = require('./rating-updater');

async function runProcessing(exploitData) {
  const updater = new RatingUpdater();
  const updatedAuditors = updater.updateRatings(exploitData);
  // Here, could send notifications, e.g., console.log or email
  console.log('Updated auditors:', updatedAuditors);
  return updatedAuditors;
}

module.exports = { runProcessing };