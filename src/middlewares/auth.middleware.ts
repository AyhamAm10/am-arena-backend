import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data_source";
import { APIError, HttpStatusCode } from "../common/errors/api.error";
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
    } catch (error: any) {
      // Try refresh token if access token expired
      if (error.message.includes("expired")) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
          return next(
            new UnauthorizedError(
              ErrorMessages.generateErrorMessage("token", "unauthorized", lang)
            )
          );
        }

        try {
          const refreshDecoded = JwtService.verifyRefreshToken(refreshToken);
          
          // Generate new access token
          const newAccessToken = JwtService.signAccessToken({
            userId: refreshDecoded.userId,
            email: refreshDecoded.email,
            role: refreshDecoded.role,
          });

          res.setHeader("Authorization", `Bearer ${newAccessToken}`);
          decoded = refreshDecoded;
        } catch {
          return next(
            new UnauthorizedError(
              ErrorMessages.generateErrorMessage("token", "unauthorized", lang)
            )
          );
        }
      } else {
        return next(
          new UnauthorizedError(
            ErrorMessages.generateErrorMessage("token", "invalid", lang)
          )
        );
      }
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
      where: { id: userId }
    });

    Ensure.exists(user , "user")
    
    req.currentUser = user?.id;
    
    return next();
  } catch (error) {
    next(error);
  }
};
