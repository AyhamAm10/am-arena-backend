import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data_source";
import { User } from "../entities/User";
import { JwtService } from "../services/jwt/jwt.service";

/**
 * Sets `req.currentUser` when a valid Bearer token is present; otherwise continues
 * without authentication (no 401). Invalid/expired tokens are ignored.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      return next();
    }

    let decoded: { userId?: number };
    try {
      decoded = JwtService.verifyAccessToken(accessToken) as { userId?: number };
    } catch {
      return next();
    }

    const userId = decoded?.userId;
    if (!userId) {
      return next();
    }

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ["id", "is_active"],
    });
    if (user?.id != null && user.is_active) {
      req.currentUser = user.id;
    }

    return next();
  } catch {
    next();
  }
};
