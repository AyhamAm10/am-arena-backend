import Redis from "ioredis";
import { logger } from "../logging/logger";

let client: Redis | null = null;

/** When true, no ioredis connection is made and REDIS_URL is ignored; callers use in-memory fallbacks. */
const REDIS_USAGE_DISABLED = true;

/**
 * Single shared Redis client for rate limiting (Upstash / TLS via REDIS_URL).
 */
export function getRedisClient(): Redis | null {
  if (REDIS_USAGE_DISABLED) {
    return null;
  }
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    return null;
  }
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });
    client.on("error", (err) => {
      logger.error("Redis client error:", err);
    });
  }
  return client;
}

export function createRedisDuplicate(): Redis | null {
  const primary = getRedisClient();
  if (!primary) {
    return null;
  }
  return primary.duplicate();
}
