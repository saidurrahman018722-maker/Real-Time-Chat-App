import session from 'express-session';
import {RedisStore} from 'connect-redis';
import {redis} from "../config/redis.connect.js";
import dotenv from 'dotenv';

dotenv.config();

const redisStore = new RedisStore({
  client: redis,
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
