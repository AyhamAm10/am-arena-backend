import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data_source";
import { User } from "../entities/User";
import { JwtService } from "../services/jwt/jwt.service";
import { resolveDashboardRoleUser } from "./dashboard-role.middleware";

/**
 * Sets `req.currentUser` when a valid Bearer token is present; otherwise continues
 * without authentication (no 401). Invalid/expired tokens are ignored.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dashboardUser = await resolveDashboardRoleUser(
      req.headers["x-dashboard-role"] as string | undefined
    );

    if (dashboardUser) {
      req.currentUser = dashboardUser.id;
      return next();
    }

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
    } catch (error: unknown) {
      return next();
    }

    const userId = decoded?.userId;
    if (!userId) {
      return next();
    }

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId },
    });
    if (user?.id != null) {
      req.currentUser = user.id;
    }

    return next();
  } catch {
    next();
  }
};
