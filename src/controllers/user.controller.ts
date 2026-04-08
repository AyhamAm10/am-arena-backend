import { NextFunction, Request, Response } from "express";
import { Ensure, Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  GetBestUsersQueryDto,
  getBestUsersQuerySchema,
} from "../dto/user/get-best-users-query.dto";
import {
  SearchUsersQueryDto,
  searchUsersQuerySchema,
} from "../dto/user/search-users-query.dto";
import {
  GetUserProfileParamsDto,
  getUserProfileParamsSchema,
} from "../dto/user/get-user-profile-params.dto";
import {
  ProfileUpdateDto,
  profileUpdateSchema,
} from "../dto/user/update-profile.dto";
import { UserService } from "../services/repo/user/user.service";
import { imageUrl } from "../utils/handle-generate-url";
export class UserController {
  constructor() {
    this.getBestUsers = this.getBestUsers.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
  }

  async getBestUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const dto = (await validator(
        getBestUsersQuerySchema,
        req.query
      )) as GetBestUsersQueryDto;

      const userService = new UserService();
      const { data, total, page, limit } = await userService.getBestUsers(dto);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("user", "retrieved", lang),
          {
            count: total,
            page,
            limit,
          }
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const dto = (await validator(
        searchUsersQuerySchema,
        req.query
      )) as SearchUsersQueryDto;

      const userService = new UserService();
      const { data, total, page, limit } = await userService.searchUsers(
        userId,
        dto
      );

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("user", "retrieved", lang),
          {
            count: total,
            page,
            limit,
          }
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const dto = (await validator(
        getUserProfileParamsSchema,
        req.params
      )) as GetUserProfileParamsDto;

      const requestingUserId = (req as any).currentUser as number | undefined;
      const userService = new UserService();
      const profile = await userService.getUserProfile(dto.id, requestingUserId);

      return res.json(
        ApiResponse.success(
          profile,
          ErrorMessages.generateErrorMessage("user", "retrieved", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const userId = (req as Request & { currentUser?: number }).currentUser;
      Ensure.exists(userId, "user");

      const dto = (await validator(
        profileUpdateSchema,
        req.body
      )) as ProfileUpdateDto;

      const profilePictureUrl = req.file
        ? imageUrl(req.file.filename)
        : undefined;
      const userService = new UserService();
      const profile = await userService.updateProfile(
        userId as number,
        dto,
        profilePictureUrl
      );

      return res.json(
        ApiResponse.success(
          profile,
          ErrorMessages.generateErrorMessage("user", "updated", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
