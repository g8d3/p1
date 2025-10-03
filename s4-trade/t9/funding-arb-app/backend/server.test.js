const request = require('supertest');
const app = require('./server');

jest.mock('axios');
const axios = require('axios');

describe('GET /api/funding-rates', () => {
  it('should return funding rates', async () => {
    axios.post.mockResolvedValue({ data: { fundingHistory: [] } });
    axios.get.mockResolvedValue({ data: { rates: [] } });

    const res = await request(app).get('/api/funding-rates');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('hyperliquid');
  });
});

describe('GET /api/arbitrage', () => {
  it('should return arbitrage data', async () => {
    axios.post.mockResolvedValue({ data: { fundingHistory: [] } });
    axios.get.mockResolvedValue({ data: { rates: [] } });

    const res = await request(app).get('/api/arbitrage');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('opportunities');
  });
});