import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  GetBestUsersQueryDto,
  getBestUsersQuerySchema,
} from "../dto/user/get-best-users-query.dto";
import {
  GetUserProfileParamsDto,
  getUserProfileParamsSchema,
} from "../dto/user/get-user-profile-params.dto";
import { UserService } from "../services/repo/user/user.service";

export class UserController {
  constructor() {
    this.getBestUsers = this.getBestUsers.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
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

  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const dto = (await validator(
        getUserProfileParamsSchema,
        req.params
      )) as GetUserProfileParamsDto;

      const userService = new UserService();
      const profile = await userService.getUserProfile(Number(dto.id));

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
}
