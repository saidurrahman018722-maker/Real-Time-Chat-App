const Redis = require('ioredis');

// Connect to the shared Redis instance running in Docker on port 6379
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // Good for rate-limiters
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Shared Redis'));

module.exports = redisClient;
