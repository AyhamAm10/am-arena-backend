/**
 * PUBG tournament creation flow (implement in PubgTournamentService.createPubgTournament):
 *
 * Admin provides:
 * - PUBG tournament data: title, description, type, entry_fee, prize_pool, max_players, start_date, end_date, created_by
 * - PUBG game data: type (solo/duo/squad), map, max_players, entry_fee, prize_pool
 * - Registration fields required for the tournament: label, type, options, required
 *
 * Flow steps:
 * 1. Create a pubg_game record first (with the PUBG-specific game data)
 * 2. Create a tournaments record with game_type = 'pubg', game_ref_id = pubg_game.id, and created_by from admin input
 * 3. Create any pubg_registration_fields required for this tournament
 *
 * This ensures that all related tables (pubg_game, tournaments, pubg_registration_fields) are populated and linked correctly.
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
import { PubgTournamentService } from "../services/repo/pubg-tournament/pubg-tournament.service";

export class PubgTournamentController {
  constructor() {
    this.createPubgTournament = this.createPubgTournament.bind(this);
    this.updatePubgTournament = this.updatePubgTournament.bind(this);
    this.deletePubgTournament = this.deletePubgTournament.bind(this);
    this.getPubgTournament = this.getPubgTournament.bind(this);
    this.getPubgTournaments = this.getPubgTournaments.bind(this);
    this.getRegistrationFields = this.getRegistrationFields.bind(this);
    this.registerForTournament = this.registerForTournament.bind(this);
  }

  async createPubgTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "ar";

      await validator(createPubgTournamentSchema, req.body);
      const dto = req.body as CreatePubgTournamentDto;

      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const pubgTournamentService = new PubgTournamentService();
      const tournament = await pubgTournamentService.createPubgTournament({
        ...dto,
        createdById: userId,
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

      await validator(updatePubgTournamentSchema, req.body);
      const dto = req.body as UpdatePubgTournamentDto;
      const id = req.params.id as string;

      const pubgTournamentService = new PubgTournamentService();
      const tournament = await pubgTournamentService.updatePubgTournament(id, dto);

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
      const { data, total, page, limit } = await pubgTournamentService.getPubgTournaments(dto);

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
        dto.field_values as { field_id: number; value: string }[]
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
}
