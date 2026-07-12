import { redis } from "../config/redis.connect.js";

const TOKEN_BUCKET_LUA_SCRIPT = `
  local tokens_key = KEYS[1]
  local timestamp_key = KEYS[2]
  local rate = tonumber(ARGV[1])
  local capacity = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  local fill_time = capacity / rate
  local ttl = math.floor(fill_time * 2)
  if ttl < 1 then ttl = 1 end

  local last_tokens = tonumber(redis.call("get", tokens_key))
  if last_tokens == nil then
    last_tokens = capacity
  end

  local last_refreshed = tonumber(redis.call("get", timestamp_key))
  if last_refreshed == nil then
    last_refreshed = 0
  end

  local delta = math.max(0, now - last_refreshed)
  local filled_tokens = math.min(capacity, last_tokens + (delta * rate))
  local allowed = filled_tokens >= requested
  local new_tokens = filled_tokens
  
  if allowed then
    new_tokens = filled_tokens - requested
  end

  redis.call("setex", tokens_key, ttl, new_tokens)
  redis.call("setex", timestamp_key, ttl, now)

  return { allowed and 1 or 0, new_tokens }
`;

redis.defineCommand("tokenBucket", {
  numberOfKeys: 2,
  lua: TOKEN_BUCKET_LUA_SCRIPT,
});

export const rateLimiter = (options = {}) => {
  const capacity = options.capacity || 100;
  const rate = options.rate || 10;
  const prefix = options.prefix || "default";

  return async (req, res, next) => {
    try {
      const identifier = (req.session && req.session.userId) || req.ip;

      const tokensKey = `rate_limit:${prefix}:${identifier}:tokens`;
      const timestampKey = `rate_limit:${prefix}:${identifier}:timestamp`;
      const now = Date.now() / 1000; // current time in seconds

      const [allowed, remainingTokens] = await redis.tokenBucket(
        tokensKey,
        timestampKey,
        rate,
        capacity,
        now,
        1
      );

      res.setHeader(`X-RateLimit-Limit-${prefix}`, capacity);
      res.setHeader(
        `X-RateLimit-Remaining-${prefix}`,
        Math.floor(remainingTokens)
      );

      if (!allowed) {
        return res.status(429).json({
          success: false,
          message: "Too Many Requests: Please try again later.",
        });
      }

      next();
    } catch (error) {
      console.error(`Rate Limiter Error (${prefix}):`, error);
      next();
    }
  };
};

// Category 1: Standard
// 10 requests max, refilling at 1 token per second
export const standardLimiter = rateLimiter({
  capacity: 10,
  rate: 1,
  prefix: "standard",
});

// Category 2: Costly
// 10 requests max, refilling at 1 token per minute (1/60 tokens per sec)
export const costlyLimiter = rateLimiter({
  capacity: 10,
  rate: 1 / 60,
  prefix: "costly",
});

// Category 3: Strict
// 5 requests max, refilling at 1 token per 5 minutes (1/300 tokens per sec)
export const strictLimiter = rateLimiter({
  capacity: 5,
  rate: 1 / 300,
  prefix: "strict",
});
