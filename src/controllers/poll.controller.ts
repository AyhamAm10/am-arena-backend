import { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "../common/errors/api.error";
import { Ensure, Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  addPollOptionSchema,
  castVoteSchema,
  chatPollParamsSchema,
  createPollSchema,
  listPollsQuerySchema,
  notifyGlobalPollSchema,
  pollAnalyticsQuerySchema,
  pollIdParamsSchema,
  tournamentPollParamsSchema,
  updatePollSchema,
  type AddPollOptionDto,
  type CastVoteDto,
  type ChatPollParamsDto,
  type CreatePollDto,
  type ListPollsQueryDto,
  type NotifyGlobalPollDto,
  type PollAnalyticsQueryDto,
  type PollIdParamsDto,
  type TournamentPollParamsDto,
  type UpdatePollDto,
} from "../dto/poll/poll.dto";
import { PollService } from "../services/repo/poll/poll.service";

export class PollController {
  private readonly pollService = new PollService();

  constructor() {
    this.listPolls = this.listPolls.bind(this);
    this.getPollById = this.getPollById.bind(this);
    this.getTournamentPolls = this.getTournamentPolls.bind(this);
    this.getChatPolls = this.getChatPolls.bind(this);
    this.castVote = this.castVote.bind(this);
    this.createPoll = this.createPoll.bind(this);
    this.updatePoll = this.updatePoll.bind(this);
    this.deletePoll = this.deletePoll.bind(this);
    this.addOption = this.addOption.bind(this);
    this.removeOption = this.removeOption.bind(this);
    this.getAnalytics = this.getAnalytics.bind(this);
    this.notifyGlobalPoll = this.notifyGlobalPoll.bind(this);
  }

  async listPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = (await validator(
        listPollsQuerySchema,
        req.query,
      )) as ListPollsQueryDto;
      const { data, total, page, limit } = await this.pollService.listPolls(dto);
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("polls", "retrieved", lang),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getPollById(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const currentUserId = req.currentUser ?? null;
      const result = await this.pollService.getPollById(params.id, currentUserId);
      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("poll", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getTournamentPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        tournamentPollParamsSchema,
        req.params,
      )) as TournamentPollParamsDto;
      const currentUserId = req.currentUser ?? null;
      const result = await this.pollService.getTournamentPolls(params.tournamentId, currentUserId);
      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("polls", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getChatPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        chatPollParamsSchema,
        req.params,
      )) as ChatPollParamsDto;
      const currentUserId = req.currentUser ?? null;
      const result = await this.pollService.getChatPolls(params.chatId, currentUserId);
      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("polls", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async castVote(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = req.currentUser;
      Ensure.exists(userId, "user");
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const dto = (await validator(
        castVoteSchema,
        req.body,
      )) as CastVoteDto;
      const result = await this.pollService.castVote(params.id, dto.option_id, userId);
      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("vote", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async createPoll(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const currentUserId = req.currentUser;
      Ensure.exists(currentUserId, "user");
      const dto = (await validator(
        createPollSchema,
        req.body,
      )) as CreatePollDto;
      const result = await this.pollService.createPoll(currentUserId, dto);
      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("poll", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updatePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const dto = (await validator(
        updatePollSchema,
        req.body,
      )) as UpdatePollDto;
      const result = await this.pollService.updatePoll(params.id, dto);
      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("poll", "updated", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async deletePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      await this.pollService.deletePoll(params.id);
      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("poll", "deleted", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async addOption(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const dto = (await validator(
        addPollOptionSchema,
        req.body,
      )) as AddPollOptionDto;
      const result = await this.pollService.addOption(params.id, dto);
      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("poll option", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async removeOption(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const optionId = Number(req.params.optionId);
      Ensure.isNumber(optionId, "optionId");
      await this.pollService.removeOption(params.id, optionId);
      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("poll option", "deleted", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const query = (await validator(
        pollAnalyticsQuerySchema,
        req.query,
      )) as PollAnalyticsQueryDto;
      const result = await this.pollService.getPollAnalytics(
        params.id,
        query,
        (req.headers["x-dashboard-role"] as string | undefined) ?? null,
      );
      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("poll analytics", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async notifyGlobalPoll(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = (await validator(
        pollIdParamsSchema,
        req.params,
      )) as PollIdParamsDto;
      const dto = (await validator(
        notifyGlobalPollSchema,
        req.body,
      )) as NotifyGlobalPollDto;
      const result = await this.pollService.notifyGlobalPoll(params.id, dto);
      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("poll notification", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }
}
