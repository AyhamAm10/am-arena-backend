import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data_source";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { UnauthorizedError } from "../common/errors/http.error";
import { User } from "../entities/User";
import { JwtService } from "../services/jwt/jwt.service";
import { getLanguage } from "./lang.middleware";
import { Ensure } from "../common/errors/Ensure.handler";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lang = getLanguage();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new UnauthorizedError(
          ErrorMessages.generateErrorMessage("token", "required", lang)
        )
      );
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      return next(
        new UnauthorizedError(
          ErrorMessages.generateErrorMessage("token", "required", lang)
        )
      );
    }

    let decoded;
    try {
      decoded = JwtService.verifyAccessToken(accessToken);
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(
          new UnauthorizedError(
            ErrorMessages.generateErrorMessage("token", "invalid", lang)
          )
        );
      }
      return next(
        new UnauthorizedError(
          ErrorMessages.generateErrorMessage("token", "invalid", lang)
        )
      );
    }

    const userId = decoded?.userId;
    if (!userId) {
      return next(
        new UnauthorizedError(
          ErrorMessages.generateErrorMessage("user", "unauthorized", lang)
        )
      );
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    Ensure.exists(user, "user");

    req.currentUser = user?.id;

    return next();
  } catch (error) {
    next(error);
  }
};
