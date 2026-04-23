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
 * Startup notice for HTTP rate limiting backing. Never exits the process.
 */
export function assertRateLimitRedisOrExit(): void {
  if (Environment.isTest()) {
    return;
  }
  logger.info(
    "HTTP rate limiting uses the in-memory store (Redis is not used in this process)."
  );
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
