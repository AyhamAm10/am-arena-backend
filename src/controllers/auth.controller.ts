import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { APIError, HttpStatusCode } from "../common/errors/api.error";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { AuthRegisterDto, authRegisterSchema } from "../dto/auth/auth-register.dto";
import { AuthService } from "../services/repo/auth/auth.service";
import { AuthLoginDto, authLoginSchema } from "../dto/auth/auth-login.dto";
import { AuthRefreshDto, authRefreshSchema } from "../dto/auth/auth-refresh.dto";
import { serializeUserAccount } from "../utils/serialize-user";

/**
 * Web can use httpOnly cookies; React Native cannot rely on cookies for refresh.
 * Clients that send `X-Refresh-Token-Delivery: body` receive the refresh token in JSON.
 */
function shouldExposeRefreshToken(req: Request) {
  const mode = (req.get("X-Refresh-Token-Delivery") ?? "").trim().toLowerCase();
  return mode === "body";
}

export class AuthController {
  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      await validator(authRegisterSchema, req.body);
      const dto = req.body as AuthRegisterDto;
      const authService = new AuthService();

      const { user, accessToken, refreshToken } = await authService.register({
        email: dto.email,
        full_name: dto.full_name,
        country: dto.country,
        password: dto.password,
        phone: dto.phone,
        gamer_name: dto.gamer_name,
        avatarUrl: dto.avatarUrl ?? undefined,
        avatarPublicId: dto.avatarPublicId ?? undefined,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const responseData: {
        user: ReturnType<typeof serializeUserAccount>;
        accessToken: string;
        refreshToken?: string;
      } = {
        user: serializeUserAccount(user as any),
        accessToken,
      };
      if (shouldExposeRefreshToken(req)) {
        responseData.refreshToken = refreshToken;
      }

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          responseData,
          ErrorMessages.generateErrorMessage("user", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      await validator(authLoginSchema, req.body);
      const dto = req.body as AuthLoginDto;

      const authService = new AuthService();

      const { user, accessToken, refreshToken } = await authService.login({
        email: dto.email,
        password: dto.password,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const responseData: {
        user: ReturnType<typeof serializeUserAccount>;
        accessToken: string;
        refreshToken?: string;
      } = {
        user: serializeUserAccount(user as any),
        accessToken,
      };
      if (shouldExposeRefreshToken(req)) {
        responseData.refreshToken = refreshToken;
      }

      return res.json(
        ApiResponse.success(
          responseData,
          ErrorMessages.generateErrorMessage("user", "logged in", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      await validator(authRefreshSchema, req.body ?? {});
      const dto = req.body as AuthRefreshDto;
      const cookieToken = req.cookies?.refreshToken as string | undefined;
      const refreshToken = (cookieToken?.trim() || dto.refreshToken?.trim() || "") as string;

      const authService = new AuthService();
      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      return res.json(
        ApiResponse.success(
          { accessToken },
          ErrorMessages.generateErrorMessage("token", "retrieved", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      if (userId) {
        const authService = new AuthService();
        await authService.revokeRefreshToken(Number(userId));
      }
      res.clearCookie("refreshToken");
      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("user", "logged out", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;

      if (!userId) {
        throw new APIError(
          HttpStatusCode.UNAUTHORIZED,
          ErrorMessages.generateErrorMessage("user", "unauthorized", lang)
        );
      }

      const authService = new AuthService();
      const user = await authService.findOneByCondition({ id: userId }, [
        "achievements",
        "achievements.achievement",
        "friends",
        "selected_achievement",
      ]);

      if (!user) {
        throw new APIError(
          HttpStatusCode.NOT_FOUND,
          ErrorMessages.generateErrorMessage("user", "not found", lang)
        );
      }

      const { password_hash, ...userInfo } = user;

      return res.json(
        ApiResponse.success(
          serializeUserAccount(userInfo as any),
          ErrorMessages.generateErrorMessage("user", "retrieved", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
