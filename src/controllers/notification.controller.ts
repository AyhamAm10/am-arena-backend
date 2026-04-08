import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { notificationListQuerySchema } from "../dto/notification/notification-list-query.dto";
import { notificationIdParamsSchema } from "../dto/notification/notification-id-params.dto";
import { notificationPushTokenSchema } from "../dto/notification/notification-push-token.dto";
import { NotificationService } from "../services/repo/notification/notification.service";
import { Ensure } from "../common/errors/Ensure.handler";

export class NotificationController {
  constructor() {
    this.listMine = this.listMine.bind(this);
    this.markRead = this.markRead.bind(this);
    this.registerPushToken = this.registerPushToken.bind(this);
  }

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const dto = (await validator(
        notificationListQuerySchema,
        req.query
      )) as { page: number; limit: number };

      const service = new NotificationService();
      const { data, total, page, limit } = await service.listForUser(
        userId,
        dto.page,
        dto.limit
      );

      return res.json(
        ApiResponse.success(data, ErrorMessages.generateErrorMessage("notifications", "retrieved", lang), {
          count: total,
          page,
          limit,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const params = (await validator(
        notificationIdParamsSchema,
        req.params
      )) as { id: number };

      const service = new NotificationService();
      const result = await service.markRead(userId, params.id);

      return res.json(
        ApiResponse.success(result, ErrorMessages.generateErrorMessage("notification", "updated", lang))
      );
    } catch (err) {
      next(err);
    }
  }

  async registerPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      await validator(notificationPushTokenSchema, req.body);
      const dto = req.body as { expo_push_token: string };

      const service = new NotificationService();
      const result = await service.registerExpoPushToken(userId, dto.expo_push_token);

      return res.json(
        ApiResponse.success(result, ErrorMessages.generateErrorMessage("notification", "updated", lang))
      );
    } catch (err) {
      next(err);
    }
  }
}
