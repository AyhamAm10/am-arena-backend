import { rateLimit, type Options, type RateLimitExceededEventHandler } from "express-rate-limit";
import type { RedisReply } from "rate-limit-redis";
import { RedisStore } from "rate-limit-redis";
import { Environment } from "../../environment";
import { logger } from "../../logging/logger";
import { getRedisClient } from "../../config/redis.client";
import {
  buildAuthRateLimitKey,
  buildCoinsRateLimitKey,
  buildGlobalRateLimitKey,
  buildVoteRateLimitKey,
} from "./rate-limit-keys";

const WINDOW_MS = 60_000;

const tooManyHandler: RateLimitExceededEventHandler = (
  _req,
  res,
  _next,
  _options
) => {
  res.status(429).json({
    error: "Too many requests, please try again later.",
  });
};

function createRedisStore(): RedisStore | undefined {
  const redis = getRedisClient();
  if (!redis) {
    return undefined;
  }
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<RedisReply>,
    prefix: "rl:",
  });
}

/**
 * Ensures Redis is available when required (production).
 */
export function assertRateLimitRedisOrExit(): void {
  if (Environment.isTest()) {
    return;
  }
  if (Environment.isProduction() && !process.env.REDIS_URL?.trim()) {
    logger.error(
      "REDIS_URL is required in production for rate limiting. Refusing to start."
    );
    process.exit(1);
  }
  if (!Environment.isProduction() && !process.env.REDIS_URL?.trim()) {
    logger.warn(
      "REDIS_URL is not set — rate limits use in-memory store (development only)."
    );
  }
}

function baseOptions(): Partial<Options> {
  return {
    windowMs: WINDOW_MS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooManyHandler,
  };
}

export const globalRateLimiter = rateLimit({
  ...baseOptions(),
  limit: 100,
  store: createRedisStore(),
  keyGenerator: (req) => buildGlobalRateLimitKey(req),
});

export const authStrictRateLimiter = rateLimit({
  ...baseOptions(),
  limit: 5,
  store: createRedisStore(),
  keyGenerator: (req) => buildAuthRateLimitKey(req),
});

export const publicReadHeavyRateLimiter = rateLimit({
  ...baseOptions(),
  limit: 20,
  store: createRedisStore(),
  keyGenerator: (req) => buildGlobalRateLimitKey(req),
});

export const coinsStrictRateLimiter = rateLimit({
  ...baseOptions(),
  limit: 10,
  store: createRedisStore(),
  keyGenerator: (req) => buildCoinsRateLimitKey(req),
});

/** Poll vote and similar abuse-prone authenticated actions */
export const voteStrictRateLimiter = rateLimit({
  ...baseOptions(),
  limit: 20,
  store: createRedisStore(),
  keyGenerator: (req) => buildVoteRateLimitKey(req),
});
