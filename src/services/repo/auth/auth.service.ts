import { Ensure } from "../../../common/errors/Ensure.handler";

import { User } from "../../../entities/User";
import { RepoService } from "../../repo.service";
import { JwtService, type TokenPayload } from "../../jwt/jwt.service";
import bcrypt from "bcryptjs";
import { getLanguage } from "../../../middlewares/lang.middleware";
import { ErrorMessages } from "../../../common/errors/ErrorMessages";
import { AuthRegisterDto } from "../../../dto/auth/auth-register.dto";
import { AuthLoginDto } from "../../../dto/auth/auth-login.dto";
import { ForbiddenError } from "../../../common/errors/http.error";
import { getRedisClient } from "../../../config/redis.client";
import { createHash } from "crypto";

type RegisterParams = Pick<
  AuthRegisterDto,
  "email" | "password" | "full_name" | "gamer_name" | "country" | "phone" | "avatarUrl" | "avatarPublicId"
>;
type LoginParams = Pick<AuthLoginDto, "email" | "password">;
const refreshTokenFallbackStore = new Map<number, string>();

export class AuthService extends RepoService<User> {
  constructor() {
    super(User);

    // Bind methods to avoid losing context when used as callbacks
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async persistRefreshToken(userId: number, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const redis = getRedisClient();
    if (redis) {
      await redis.set(`refresh-token:${userId}`, tokenHash);
      return;
    }
    refreshTokenFallbackStore.set(userId, tokenHash);
  }

  private async assertRefreshTokenActive(userId: number, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const redis = getRedisClient();
    const stored = redis
      ? await redis.get(`refresh-token:${userId}`)
      : refreshTokenFallbackStore.get(userId);
    Ensure.unauthorized(stored === tokenHash, "token");
  }

  async revokeRefreshToken(userId: number) {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`refresh-token:${userId}`);
      return;
    }
    refreshTokenFallbackStore.delete(userId);
  }

  async refreshAccessToken(refreshToken: string) {
    Ensure.required(refreshToken?.trim(), "refresh token");
    const trimmed = refreshToken.trim();
    let payload: TokenPayload;
    try {
      payload = JwtService.verifyRefreshToken(trimmed);
    } catch {
      Ensure.unauthorized(false, "token");
      throw new Error("unreachable");
    }
    Ensure.isNumber(payload.userId, "user");
    await this.assertRefreshTokenActive(payload.userId, trimmed);
    const user = await this.findOneByCondition({ id: payload.userId });
    Ensure.exists(user, "user");
    if (!user!.is_active) {
      throw new ForbiddenError(
        ErrorMessages.generateErrorMessage("user", "forbidden", getLanguage())
      );
    }
    const accessToken = JwtService.signAccessToken({
      userId: user!.id,
      email: user!.email,
      role: user!.role,
    });
    return { accessToken };
  }

  async register(params: RegisterParams) {
    const { full_name , gamer_name , country, phone , avatarUrl , avatarPublicId , email, password } = params;
    const currentLang = getLanguage();
    
    const existingUser = await this.findOneByCondition({ email });
    Ensure.alreadyExists(!!existingUser, "user");

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.create({ 
      email, 
      password_hash: hashedPassword,
      full_name , 
      gamer_name,
      country,
      phone,
      profile_picture_url: avatarUrl,
      avatar_public_id: avatarPublicId
    });

    const tokens = JwtService.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    await this.persistRefreshToken(newUser.id, tokens.refreshToken);

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, ...tokens };
  }

  async login(params: LoginParams) {
    const { email, password } = params;
    const currentLang = getLanguage();
    
    // Find user with password field included
    const user = await this.repo.findOne({ 
      where: { email },
      select: ['id', 'achievements', "password_hash", 'email', 'coins', 'role', 'full_name', 'gamer_name', 'country', 'is_active', 'profile_picture_url', 'avatar_public_id']
    });
    Ensure.exists(user, "user");
    if (!user!.is_active) {
      throw new ForbiddenError(
        ErrorMessages.generateErrorMessage("user", "forbidden", currentLang)
      );
    }

    // Verify password
    Ensure.exists(user?.password_hash, "password");

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error(ErrorMessages.generateErrorMessage("password", "invalid", currentLang));
    }

    const tokens = JwtService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }
}
