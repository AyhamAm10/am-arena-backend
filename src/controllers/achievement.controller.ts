import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { HttpStatusCode } from "../common/errors/api.error";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { CreateAchievementDto, createAchievementSchema } from "../dto/achievement/create-achievement.dto";
import { UpdateAchievementDto, updateAchievementSchema } from "../dto/achievement/update-achievement.dto";
import { GetAchievementsQueryDto, getAchievementsQuerySchema } from "../dto/achievement/get-achievements-query.dto";
import { AssignAchievementDto, assignAchievementSchema } from "../dto/achievement/assign-achievement.dto";
import { AchievementService } from "../services/repo/achievement/achievement.service";
import { Ensure } from "../common/errors/Ensure.handler";

export class AchievementController {
  constructor() {
    this.createAchievement = this.createAchievement.bind(this);
    this.updateAchievement = this.updateAchievement.bind(this);
    this.deleteAchievement = this.deleteAchievement.bind(this);
    this.getAchievements = this.getAchievements.bind(this);
    this.assignToUser = this.assignToUser.bind(this);
  }

  async createAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      await validator(createAchievementSchema, req.body);
      const dto = req.body as CreateAchievementDto;
      let iconUrl: string | undefined = dto.icon_url;
      if (req.file) {
        iconUrl = `icons/${req.file.filename}`;
      }
      Ensure.required(iconUrl, "icon");

      const achievementService = new AchievementService();
      const result = await achievementService.createAchievement({ ...dto, icon_url: iconUrl });

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("achievement", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async updateAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      await validator(updateAchievementSchema, req.body);
      const dto = req.body as UpdateAchievementDto;
      const id = req.params.id as string;

      const achievementService = new AchievementService();
      const result = await achievementService.updateAchievement(id, dto);

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("achievement", "updated", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const id = req.params.id as string;

      const achievementService = new AchievementService();
      await achievementService.deleteAchievement(id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("achievement", "deleted", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = (await validator(getAchievementsQuerySchema, req.query)) as GetAchievementsQueryDto;

      const achievementService = new AchievementService();
      const { data, total, page, limit } = await achievementService.getAchievements(dto);

      return res.json(
        ApiResponse.success(data, ErrorMessages.generateErrorMessage("achievements", "retrieved", lang), {
          count: total,
          page,
          limit,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  async assignToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      await validator(assignAchievementSchema, req.body);
      const dto = req.body as AssignAchievementDto;
      const id = req.params.id as string;

      const achievementService = new AchievementService();
      const result = await achievementService.assignToUser(id, dto.user_id);

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("achievement", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
