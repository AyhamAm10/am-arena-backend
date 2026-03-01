import { sign, verify, type SignOptions, type Secret } from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  email?: string;
  role?: string;
}

function parseExpires(
  value: string | undefined,
  fallback: SignOptions['expiresIn']
): SignOptions['expiresIn'] {
  const v = (value ?? '').trim();
  if (!v) return fallback;

  // لو كانت رقم => ثواني
  if (/^\d+$/.test(v)) return Number(v);

  // لو كانت بصيغة ms (15m/1h/7d..)
  if (/^\d+(ms|s|m|h|d|w|y)$/.test(v)) return v as SignOptions['expiresIn'];

  // fallback آمن
  return fallback;
}

export class JwtService {
  private static readonly ACCESS_SECRET: Secret =
    process.env.ACCESS_TOKEN_SECRET ?? 'access-secret';

  private static readonly REFRESH_SECRET: Secret =
    process.env.REFRESH_TOKEN_SECRET ?? 'refresh-secret';

  private static readonly ACCESS_EXPIRES_IN: SignOptions['expiresIn'] =
    parseExpires(process.env.ACCESS_TOKEN_EXPIRES_IN, '24h');

  private static readonly REFRESH_EXPIRES_IN: SignOptions['expiresIn'] =
    parseExpires(process.env.REFRESH_TOKEN_EXPIRES_IN, '90d');

  static signAccessToken(payload: TokenPayload): string {
    return sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES_IN,
    });
  }

  static signRefreshToken(payload: TokenPayload): string {
    return sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return verify(token, this.ACCESS_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return verify(token, this.REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }
}
