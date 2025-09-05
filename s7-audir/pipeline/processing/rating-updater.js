const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '../logs/processing.log' })
  ]
});

// Mock database for auditors
const auditors = [
  { id: 1, name: 'Auditor A', rating: 95, auditedContracts: ['0x123'] },
  { id: 2, name: 'Auditor B', rating: 90, auditedContracts: ['0x456'] }
];

class RatingUpdater {
  constructor() {
    this.auditors = auditors;
  }

  updateRatings(exploitData) {
    exploitData.forEach(exploit => {
      if (exploit.contract) {
        const affectedAuditors = this.auditors.filter(auditor =>
          auditor.auditedContracts.includes(exploit.contract)
        );
        affectedAuditors.forEach(auditor => {
          auditor.rating = Math.max(0, auditor.rating - 10); // Deduct 10 points
          logger.info(`Updated rating for ${auditor.name} to ${auditor.rating} due to exploit in ${exploit.contract}`);
        });
      }
    });
    return this.auditors;
  }

  getAuditors() {
    return this.auditors;
  }
}

module.exports = RatingUpdater;