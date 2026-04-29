import { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "../common/errors/api.error";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { AdminService } from "../services/repo/admin/admin.service";
import {
  getAdminUsersQuerySchema,
  updateAdminUserBalanceSchema,
  updateAdminUserStatusSchema,
} from "../dto/admin/admin-users.dto";
import {
  adminIdParamsSchema,
  createAdminChannelSchema,
  updateAdminChannelSchema,
} from "../dto/admin/admin-chat.dto";
import { createAdminNotificationSchema } from "../dto/admin/admin-notification.dto";
import { createAdminMessageSchema } from "../dto/admin/admin-message.dto";
import { getChannelsQuerySchema } from "../dto/chat/get-channels-query.dto";
import { Ensure } from "../common/errors/Ensure.handler";
import { getIO } from "../socket/io";
import { NotificationService } from "../services/repo/notification/notification.service";
import { updateReelSchema } from "../dto/reel/update-reel.dto";
import {
  createSuperTournamentSchema,
  updateSuperTournamentSchema,
} from "../dto/admin/admin-super-tournament.dto";
import {
  AdminPaymentIdParamsDto,
  adminPaymentIdParamsSchema,
  approvePackageRequestSchema,
  GetAdminPackageRequestsQueryDto,
  getAdminPackageRequestsQuerySchema,
  rejectPackageRequestSchema,
} from "../dto/admin/admin-package-requests.dto";
import {
  createManualCoinsSchema,
  CreateManualCoinsDto,
} from "../dto/admin/admin-manual-coins.dto";
import { PaymentService } from "../services/repo/payment/payment.service";

function normalizeMultipartTournamentBody(body: Request["body"]) {
  const normalized = { ...body } as Record<string, unknown>;

  if (typeof normalized.game === "string") {
    normalized.game = JSON.parse(normalized.game);
  }

  if (typeof normalized.registration_fields === "string") {
    normalized.registration_fields = JSON.parse(normalized.registration_fields);
  }

  if (typeof normalized.notify_all_users === "string") {
    normalized.notify_all_users = normalized.notify_all_users === "true";
  }

  return normalized;
}

export class AdminController {
  private readonly adminService = new AdminService();

  constructor() {
    this.getUsers = this.getUsers.bind(this);
    this.updateUserStatus = this.updateUserStatus.bind(this);
    this.updateUserBalance = this.updateUserBalance.bind(this);
    this.getDashboardStats = this.getDashboardStats.bind(this);
    this.getChannels = this.getChannels.bind(this);
    this.createChannel = this.createChannel.bind(this);
    this.updateChannel = this.updateChannel.bind(this);
    this.deleteChannel = this.deleteChannel.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    this.createNotification = this.createNotification.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.updateReel = this.updateReel.bind(this);
    this.deleteReel = this.deleteReel.bind(this);
    this.sendChannelMessage = this.sendChannelMessage.bind(this);
    this.getSuperTournaments = this.getSuperTournaments.bind(this);
    this.createSuperTournament = this.createSuperTournament.bind(this);
    this.updateSuperTournament = this.updateSuperTournament.bind(this);
    this.deleteSuperTournament = this.deleteSuperTournament.bind(this);
    this.getPackageRequests = this.getPackageRequests.bind(this);
    this.approvePackageRequest = this.approvePackageRequest.bind(this);
    this.rejectPackageRequest = this.rejectPackageRequest.bind(this);
    this.createManualCoins = this.createManualCoins.bind(this);
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = await validator(getAdminUsersQuerySchema, req.query);
      const { data, total, page, limit } = await this.adminService.getUsers(dto);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("users", "retrieved", lang),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      const dto = await validator(updateAdminUserStatusSchema, req.body);
      const result = await this.adminService.updateUserStatus(params.id, dto);

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("user", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUserBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      const dto = await validator(updateAdminUserBalanceSchema, req.body);
      const result = await this.adminService.updateUserBalance(params.id, dto);

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("user", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const result = await this.adminService.getDashboardStats();

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("dashboard", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = await validator(getChannelsQuerySchema, req.query);
      const { data, total, page, limit } = await this.adminService.listChannels(dto.page, dto.limit);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("channels", "retrieved", lang),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const dto = await validator(createAdminChannelSchema, req.body);
      const result = await this.adminService.createChannel(currentUserId, dto);

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("channel", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      const dto = await validator(updateAdminChannelSchema, req.body);
      const result = await this.adminService.updateChannel(params.id, dto);

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("channel", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      await this.adminService.deleteChannel(params.id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("channel", "deleted", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async sendChannelMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const params = await validator(adminIdParamsSchema, req.params);
      const dto = await validator(createAdminMessageSchema, req.body);
      const result = await this.adminService.sendChannelMessage(params.id, currentUserId, dto.content);

      const io = getIO();
      if (io) {
        io.to(`channel:${params.id}`).emit("new-message", result);
      }

      const notificationService = new NotificationService();
      await notificationService.notifyChatMessageForChannelMembers({
        channelId: params.id,
        senderId: currentUserId,
        contentPreview: dto.content,
        channelTitle: (result as { channel_title?: string }).channel_title,
        messageId: (result as { id?: number }).id,
      });

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("message", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = await validator(getChannelsQuerySchema, req.query);
      const { data, total, page, limit } = await this.adminService.listNotifications(dto.page, dto.limit);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("notifications", "retrieved", lang),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const dto = await validator(createAdminNotificationSchema, req.body);
      const result = await this.adminService.createNotification(currentUserId, dto);

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("notification", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      await this.adminService.deleteNotification(params.id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("notification", "deleted", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateReel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      const dto = await validator(updateReelSchema, req.body);
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const result = await this.adminService.updateReelAsAdmin(params.id, {
        ...dto,
        ...(req.reelVideoUrl ? { video_url: req.reelVideoUrl } : {}),
        ...(req.reelVideoPublicId
          ? { video_public_id: req.reelVideoPublicId }
          : {}),
        actorUserId: currentUserId,
      });

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("reel", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteReel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      await this.adminService.deleteReelAsAdmin(params.id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("reel", "deleted", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getSuperTournaments(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = await validator(getChannelsQuerySchema, req.query);
      const { data, total, page, limit } = await this.adminService.listSuperTournaments(dto.page, dto.limit);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("super tournaments", "retrieved", lang),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async createSuperTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const dto = await validator(
        createSuperTournamentSchema,
        normalizeMultipartTournamentBody(req.body),
      );
      const result = await this.adminService.createSuperTournament(currentUserId, {
        ...dto,
        game: {
          ...dto.game,
          image: (req.file?.path as string) || dto.game.image || "",
          image_public_id: req.file
            ? ((req.file.filename as string) || null)
            : (dto.game.image_public_id ?? null),
        },
      });

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("super tournament", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateSuperTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      const dto = await validator(
        updateSuperTournamentSchema,
        normalizeMultipartTournamentBody(req.body),
      );
      const result = await this.adminService.updateSuperTournament(params.id, {
        ...dto,
        ...(req.file
          ? {
              game: {
                ...(dto.game || {}),
                image: req.file.path as string,
                image_public_id: (req.file.filename as string) || null,
              },
            }
          : {}),
      });

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("super tournament", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteSuperTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      await this.adminService.deleteSuperTournament(params.id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("super tournament", "deleted", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getPackageRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = (await validator(
        getAdminPackageRequestsQuerySchema,
        req.query,
      )) as GetAdminPackageRequestsQueryDto;
      const paymentService = new PaymentService();
      const { data, total, page, limit } = await paymentService.listPackageRequests(
        dto,
      );
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage(
            "package requests",
            "retrieved",
            lang,
          ),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async approvePackageRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const params = (await validator(
        adminPaymentIdParamsSchema,
        req.params,
      )) as AdminPaymentIdParamsDto;
      await validator(approvePackageRequestSchema, req.body);
      const paymentService = new PaymentService();
      const data = await paymentService.approveRequest(params.id, currentUserId!);
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("payment", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async rejectPackageRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        adminPaymentIdParamsSchema,
        req.params,
      )) as AdminPaymentIdParamsDto;
      await validator(rejectPackageRequestSchema, req.body);
      const paymentService = new PaymentService();
      const data = await paymentService.rejectRequest(params.id);
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("payment", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async createManualCoins(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const dto = (await validator(
        createManualCoinsSchema,
        req.body,
      )) as CreateManualCoinsDto;
      const paymentService = new PaymentService();
      const data = await paymentService.addManualCoins(dto, currentUserId!);
      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("wallet", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }
}
