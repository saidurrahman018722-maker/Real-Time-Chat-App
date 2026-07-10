import session from 'express-session';
import {RedisStore} from 'connect-redis';
import {redis} from '../config/redis.connect.js';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// THE FIX: IOREDIS PROXY ADAPTER
// ==========================================
// This sits between connect-redis and ioredis. It passes everything through normally,
// but intercepts the 'set' command to fix the formatting bug before it hits the database.
const redisClientAdapter = new Proxy(redis, {
  get(target, prop) {
    if (prop === 'set') {
      return function (key, value, options) {
        if (options && typeof options === 'object') {
          if (options.expiration && options.expiration.type) {
            return target.set(key, value, options.expiration.type, options.expiration.value);
          } else if (options.EX) {
            return target.set(key, value, 'EX', options.EX);
          } else if (options.PX) {
            return target.set(key, value, 'PX', options.PX);
          }
        }
        return target.set(...arguments);
      };
    }
    return target[prop];
  }
});


const redisStore = new RedisStore({
  client: redisClientAdapter, 
  prefix: 'session:',
});

export const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, 
  },
});

