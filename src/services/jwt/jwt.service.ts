import jwt, { sign, verify, type SignOptions, type Secret } from "jsonwebtoken";

export interface TokenPayload {
  userId: number;
  email?: string;
  role?: string;
}

function parseExpires(
  value: string | undefined,
  fallback: SignOptions["expiresIn"]
): SignOptions["expiresIn"] {
  const v = (value ?? "").trim();
  if (!v) return fallback;

  if (/^\d+$/.test(v)) return Number(v);

  if (/^\d+(ms|s|m|h|d|w|y)$/.test(v)) return v as SignOptions["expiresIn"];

  return fallback;
}

function requireAccessSecret(): Secret {
  const s = process.env.ACCESS_TOKEN_SECRET?.trim();
  if (!s) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }
  return s;
}

function requireRefreshSecret(): Secret {
  const s = process.env.REFRESH_TOKEN_SECRET?.trim();
  if (!s) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }
  return s;
}

export class JwtService {
  private static readonly ACCESS_EXPIRES_IN: SignOptions["expiresIn"] =
    parseExpires(process.env.ACCESS_TOKEN_EXPIRES_IN, "24h");

  private static readonly REFRESH_EXPIRES_IN: SignOptions["expiresIn"] =
    parseExpires(process.env.REFRESH_TOKEN_EXPIRES_IN, "90d");

  static signAccessToken(payload: TokenPayload): string {
    return sign(payload, requireAccessSecret(), {
      expiresIn: this.ACCESS_EXPIRES_IN,
    });
  }

  static signRefreshToken(payload: TokenPayload): string {
    return sign(payload, requireRefreshSecret(), {
      expiresIn: this.REFRESH_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return verify(token, requireAccessSecret()) as TokenPayload;
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        throw e;
      }
      throw new jwt.JsonWebTokenError("Invalid access token");
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return verify(token, requireRefreshSecret()) as TokenPayload;
    } catch {
      throw new Error("Invalid or expired refresh token");
    }
  }

  static generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }
}
