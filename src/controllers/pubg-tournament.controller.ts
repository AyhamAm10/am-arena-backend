/**
 * PUBG tournament creation (PubgTournamentService.createPubgTournament):
 *
 * Admin provides:
 * - Tournament (Tournament entity): title, description, entry_fee, prize_pool, max_players, start_date, end_date, is_active, created_by
 * - PUBG game (PubgGame): type (solo/duo/squad), map; image via multipart field `image`
 * - Registration fields: label, type, options, required
 *
 * Flow: create pubg_game â†’ tournament row (game_type = 'pubg', game_ref_id) â†’ registration fields â†’ chat.
 */

import { NextFunction, Request, Response } from "express";
import { Ensure, Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { HttpStatusCode } from "../common/errors/api.error";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { CreatePubgTournamentDto, createPubgTournamentSchema } from "../dto/pubg-tournament/create-pubg-tournament.dto";
import { UpdatePubgTournamentDto, updatePubgTournamentSchema } from "../dto/pubg-tournament/update-pubg-tournament.dto";
import {
  GetPubgTournamentsQueryDto,
  getPubgTournamentsQuerySchema,
} from "../dto/pubg-tournament/get-pubg-tournaments-query.dto";
import { RegisterForTournamentDto, registerForTournamentSchema } from "../dto/pubg-tournament/register-for-tournament.dto";
import { AssignWinnersDto, assignWinnersSchema } from "../dto/pubg-tournament/assign-winners.dto";
import { PubgTournamentService } from "../services/repo/pubg-tournament/pubg-tournament.service";

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

export class PubgTournamentController {
  constructor() {
    this.createPubgTournament = this.createPubgTournament.bind(this);
    this.updatePubgTournament = this.updatePubgTournament.bind(this);
    this.deletePubgTournament = this.deletePubgTournament.bind(this);
    this.getPubgTournament = this.getPubgTournament.bind(this);
    this.getPubgTournaments = this.getPubgTournaments.bind(this);
    this.getRegistrationFields = this.getRegistrationFields.bind(this);
    this.registerForTournament = this.registerForTournament.bind(this);
    this.assignWinners = this.assignWinners.bind(this);
    this.getRegistrations = this.getRegistrations.bind(this);
    this.removeRegistration = this.removeRegistration.bind(this);
  }

  async createPubgTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "ar";

      const dto = (await validator(
        createPubgTournamentSchema,
        normalizeMultipartTournamentBody(req.body),
      )) as CreatePubgTournamentDto;


      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const pubgTournamentService = new PubgTournamentService();
      const tournament = await pubgTournamentService.createPubgTournament({
        ...dto,
        createdById: userId,
        image: (req.file?.path as string) || dto.game.image || "",
      });

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          tournament,
          ErrorMessages.generateErrorMessage("tournament", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePubgTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const dto = (await validator(
        updatePubgTournamentSchema,
        normalizeMultipartTournamentBody(req.body),
      )) as UpdatePubgTournamentDto;
      const id = req.params.id as string;
      const payload: UpdatePubgTournamentDto = {
        ...dto,
        ...(req.file
          ? {
              game: {
                ...(dto.game || {}),
                image: req.file.path as string,
              },
            }
          : {}),
      };

      const pubgTournamentService = new PubgTournamentService();
      const tournament = await pubgTournamentService.updatePubgTournament(id, payload);

      return res.json(
        ApiResponse.success(
          tournament,
          ErrorMessages.generateErrorMessage("tournament", "updated", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async deletePubgTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const id = req.params.id as string;

      const pubgTournamentService = new PubgTournamentService();
      await pubgTournamentService.deletePubgTournament(id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("tournament", "deleted", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getPubgTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const id = req.params.id as string;

      const pubgTournamentService = new PubgTournamentService();
      const tournament = await pubgTournamentService.getPubgTournament(id);

      return res.json(
        ApiResponse.success(
          tournament,
          ErrorMessages.generateErrorMessage("tournament", "retrieved", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getPubgTournaments(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const dto = await validator(getPubgTournamentsQuerySchema, req.query) as GetPubgTournamentsQueryDto;

      const pubgTournamentService = new PubgTournamentService();
      const { data , total, page, limit } = await pubgTournamentService.getPubgTournaments(dto);

      return res.json(
        ApiResponse.success(data, ErrorMessages.generateErrorMessage("tournament", "retrieved", lang), {
          count: total,
          page,
          limit,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  async getRegistrationFields(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const id = req.params.id as string;

      const pubgTournamentService = new PubgTournamentService();
      const fields = await pubgTournamentService.getRegistrationFields(id);

      return res.json(
        ApiResponse.success(
          fields,
          ErrorMessages.generateErrorMessage("registration fields", "retrieved", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async registerForTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      await validator(registerForTournamentSchema, req.body);
      const dto = req.body as RegisterForTournamentDto;
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");
      const tournamentId = req.params.id as string;

      const pubgTournamentService = new PubgTournamentService();
      const registration = await pubgTournamentService.registerForTournament(
        tournamentId,
        userId,
        dto.field_values as { field_id: number; value: string }[],
        dto.friends as number[] | undefined
      );

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          registration,
          ErrorMessages.generateErrorMessage("registration", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async assignWinners(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      await validator(assignWinnersSchema, req.body);
      const dto = req.body as AssignWinnersDto;
      const tournamentId = req.params.id as string;

      const pubgTournamentService = new PubgTournamentService();
      const tournament = await pubgTournamentService.assignWinners(
        tournamentId,
        dto.user_ids as number[]
      );

      return res.json(
        ApiResponse.success(
          tournament,
          ErrorMessages.generateErrorMessage("tournament winners", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const tournamentId = req.params.id as string;
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 50, 200);

      const pubgTournamentService = new PubgTournamentService();
      const { data, total, page: p, limit: l } =
        await pubgTournamentService.getRegistrations(tournamentId, page, limit);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("registrations", "retrieved", lang),
          { count: total, page: p, limit: l }
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async removeRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const tournamentId = req.params.id as string;
      const userId = Number(req.params.userId);
      Ensure.isNumber(userId, "userId");

      const pubgTournamentService = new PubgTournamentService();
      await pubgTournamentService.removeRegistration(tournamentId, userId);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("registration", "deleted", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
