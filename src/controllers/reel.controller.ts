import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { HttpStatusCode } from "../common/errors/api.error";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { CreateReelDto, createReelSchema } from "../dto/reel/create-reel.dto";
import { UpdateReelDto, updateReelSchema } from "../dto/reel/update-reel.dto";
import { GetReelsQueryDto, getReelsQuerySchema } from "../dto/reel/get-reels-query.dto";
import { AddCommentDto, addCommentSchema } from "../dto/reel/add-comment.dto";
import { GetCommentsQueryDto, getCommentsQuerySchema } from "../dto/reel/get-comments-query.dto";
import {
  SearchTagUsersQueryDto,
  searchTagUsersQuerySchema,
} from "../dto/reel/search-tag-users-query.dto";
import { ReelService } from "../services/repo/reel/reel.service";
import { ReelCommentService } from "../services/repo/reel-comment/reel-comment.service";
import { ReelLikeService } from "../services/repo/reel-like/reel-like.service";
import { TagService } from "../services/repo/achievement/tag.service";
import { Ensure } from "../common/errors/Ensure.handler";

export class ReelController {
  constructor() {
    this.createReel = this.createReel.bind(this);
    this.getReels = this.getReels.bind(this);
    this.updateReel = this.updateReel.bind(this);
    this.deleteReel = this.deleteReel.bind(this);
    this.addComment = this.addComment.bind(this);
    this.getReelComments = this.getReelComments.bind(this);
    this.likeReel = this.likeReel.bind(this);
    this.removeLike = this.removeLike.bind(this);
    this.searchTagUsers = this.searchTagUsers.bind(this);
  }

  async createReel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      await validator(createReelSchema, req.body);
      const dto = req.body as CreateReelDto;

      const reelService = new ReelService();
      const result = await reelService.createReel({
        title: dto.title,
        video_url: req.reelVideoUrl || dto.video_url || "",
        video_public_id: req.reelVideoPublicId,
        description: dto.description,
        userId,
        mentioned_user_ids: dto.mentioned_user_ids,
      });

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("reel", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getReels(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = (await validator(getReelsQuerySchema, req.query)) as GetReelsQueryDto;

      const viewerUserId = (req as Request & { currentUser?: number }).currentUser;
      const reelService = new ReelService();
      const { data, total, page, limit } = await reelService.getReelsForFeed(
        dto,
        viewerUserId
      );

      return res.json(
        ApiResponse.success(data, ErrorMessages.generateErrorMessage("reels", "retrieved", lang), {
          count: total,
          page,
          limit,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  async updateReel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reelId = parseInt(idParam ?? "", 10);
      Ensure.custom(!isNaN(reelId) && reelId >= 1, "Invalid reel id");

      await validator(updateReelSchema, req.body);
      const dto = req.body as UpdateReelDto;
      const newVideoUrl = req.file ? (req.file.path as string) : dto.video_url;
      const newVideoPublicId = req.file ? (req.file.filename as string) : undefined;
      Ensure.custom(
        newVideoUrl !== undefined || dto.title !== undefined || dto.description !== undefined,
        "At least one of title, description, or video must be provided"
      );

      const reelService = new ReelService();
      const result = await reelService.updateReelByOwner(reelId, userId, {
        title: dto.title,
        description: dto.description,
        video_url: newVideoUrl,
        ...(req.file ? { video_public_id: newVideoPublicId ?? null } : {}),
        mentioned_user_ids: dto.mentioned_user_ids,
      });

      return res.json(
        ApiResponse.success(result, ErrorMessages.generateErrorMessage("reel", "updated", lang))
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteReel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reelId = parseInt(idParam ?? "", 10);
      Ensure.custom(!isNaN(reelId) && reelId >= 1, "Invalid reel id");

      const reelService = new ReelService();
      await reelService.deleteReelByOwner(reelId, userId);

      return res.json(
        ApiResponse.success({}, ErrorMessages.generateErrorMessage("reel", "deleted", lang))
      );
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reelId = parseInt(idParam ?? "", 10);
      Ensure.custom(!isNaN(reelId) && reelId >= 1, "Invalid reel id");

      await validator(addCommentSchema, req.body);
      const dto = req.body as AddCommentDto;

      const reelCommentService = new ReelCommentService();
      const result = await reelCommentService.addComment(
        reelId,
        userId,
        dto.comment,
        dto.mentioned_user_ids ?? [],
      );

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("comment", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async searchTagUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const dto = (await validator(
        searchTagUsersQuerySchema,
        req.query,
      )) as SearchTagUsersQueryDto;

      const tagService = new TagService();
      const users = await tagService.searchUsersForMention(userId, dto.query, dto.limit ?? 10);

      return res.json(
        ApiResponse.success(
          users,
          ErrorMessages.generateErrorMessage("users", "retrieved", lang),
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  async getReelComments(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reelId = parseInt(idParam ?? "", 10);
      Ensure.custom(!isNaN(reelId) && reelId >= 1, "Invalid reel id");
      const dto = (await validator(getCommentsQuerySchema, req.query)) as GetCommentsQueryDto;

      const reelCommentService = new ReelCommentService();
      const { data, total, page, limit } = await reelCommentService.getCommentsByReelId(reelId, dto);

      return res.json(
        ApiResponse.success(data, ErrorMessages.generateErrorMessage("comments", "retrieved", lang), {
          count: total,
          page,
          limit,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  async likeReel(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reelId = parseInt(idParam ?? "", 10);
      Ensure.custom(!isNaN(reelId) && reelId >= 1, "Invalid reel id");

      const reelLikeService = new ReelLikeService();
      const result = await reelLikeService.likeReel(reelId, userId);

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("like", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async removeLike(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reelId = parseInt(idParam ?? "", 10);
      Ensure.custom(!isNaN(reelId) && reelId >= 1, "Invalid reel id");

      const reelLikeService = new ReelLikeService();
      await reelLikeService.removeLike(reelId, userId);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("like", "deleted", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
