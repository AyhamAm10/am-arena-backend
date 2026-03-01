import { Request, Response, NextFunction } from "express";
import { APIError, HttpStatusCode } from "../common/errors/api.error";
import { ForbiddenError } from "../common/errors/http.error";
import { AppDataSource } from "../config/data_source";
import { User, UserRole } from "../entities/User";

interface AuthenticatedRequest extends Request {
  currentUser?: number;
}

export const checkRole = (allowedRoles: UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.currentUser;
      if (!userId) {
        throw new APIError(HttpStatusCode.UNAUTHORIZED, "Unauthorized");
      }

      const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
      if (!user || !user.role) {
        throw new ForbiddenError("Access denied");
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenError("You do not have permission to access this resource");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
