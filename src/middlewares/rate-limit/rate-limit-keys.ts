import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import { TokenExpiredError } from "jsonwebtoken";
import { JwtService } from "../../services/jwt/jwt.service";

function clientIp(req: Request): string {
  const raw = req.ip || req.socket?.remoteAddress || "unknown";
  return ipKeyGenerator(raw);
}

function bearerToken(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return undefined;
  const t = h.slice(7).trim();
  return t || undefined;
}

/**
 * Identity segment for global / coins / vote buckets (before auth middleware).
 * - Valid JWT access token → numeric userId
 * - else → plain `ip` sentinel
 */
export function rateLimitIdentitySegment(req: Request): string {
  const token = bearerToken(req);
  if (token) {
    try {
      const payload = JwtService.verifyAccessToken(token);
      if (payload?.userId != null) {
        return String(payload.userId);
      }
    } catch (e) {
      if (!(e instanceof TokenExpiredError)) {
        // invalid token — treat as anonymous for rate limit key
      }
    }
  }

  return "ip";
}

/** `rate_limit:{userId}:{ip}` | `rate_limit:ip:{ip}` */
export function buildGlobalRateLimitKey(req: Request): string {
  const ip = clientIp(req);
  const id = rateLimitIdentitySegment(req);
  if (id === "ip") {
    return `rate_limit:ip:${ip}`;
  }
  return `rate_limit:${id}:${ip}`;
}

/** Stricter auth surface: per IP only */
export function buildAuthRateLimitKey(req: Request): string {
  return `rate_limit_auth:ip:${clientIp(req)}`;
}

/** Stricter payment/coins: same identity rules as global */
export function buildCoinsRateLimitKey(req: Request): string {
  const ip = clientIp(req);
  const id = rateLimitIdentitySegment(req);
  if (id === "ip") {
    return `rate_limit_coins:ip:${ip}`;
  }
  return `rate_limit_coins:${id}:${ip}`;
}

/** Stricter voting: per authenticated user + IP (or IP only if anonymous). */
export function buildVoteRateLimitKey(req: Request): string {
  return buildGlobalRateLimitKey(req).replace(/^rate_limit:/, "rate_limit_vote:");
}
