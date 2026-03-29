import { Ensure } from "../../../common/errors/Ensure.handler";
import { Tournament } from "../../../entities/Tournament";
import { Chat, ChatType } from "../../../entities/Chat";
import { RepoService } from "../../repo.service";
import { CreatePubgTournamentDto } from "../../../dto/pubg-tournament/create-pubg-tournament.dto";
import { UpdatePubgTournamentDto } from "../../../dto/pubg-tournament/update-pubg-tournament.dto";
import { GetPubgTournamentsQueryDto } from "../../../dto/pubg-tournament/get-pubg-tournaments-query.dto";
import { PubgService } from "../pubg/pubg.service";
import { PubgRegistrationFieldService } from "../pubg-registration-field/pubg-registration-field.service";
import { PubgRegistrationService } from "../pubg-registration/pubg-registration.service";
import { PubgRegistrationFieldValueService } from "../pubg-registration-field-value/pubg-registration-field-value.service";
import { ChatService } from "../chat/chat.service";
import { ChatMemberService } from "../chat-member/chat-member.service";
import { UserService } from "../user/user.service";
import { PubgType } from "../../../entities/PubgGame";
import { AppDataSource } from "../../../config/data_source";
import { In } from "typeorm";
type CreatePubgTournamentParams = CreatePubgTournamentDto & { createdById: number; image: string };
type UpdatePubgTournamentParams = UpdatePubgTournamentDto;

export class PubgTournamentService extends RepoService<Tournament> {
  constructor() {
    super(Tournament);

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

  async createPubgTournament(params: CreatePubgTournamentParams) {
    Ensure.required(params.createdById, "created_by");

    const pubgService = new PubgService();
    const game = await pubgService.createPubgGame({
      image: params.image,
      type: params.game.type,
      map: params.game.map,
    });

    const tournament = await this.create({
      game_type: "pubg",
      game_ref_id: game.id,
      title: params.title,
      description: params.description,
      entry_fee: params.entry_fee,
      prize_pool: params.prize_pool,
      max_players: params.max_players,
      start_date: params.start_date ? new Date(params.start_date) : null,
      end_date: params.end_date ? new Date(params.end_date) : null,
      is_active: params.is_active ?? true,
      created_by: { id: params.createdById } as any,
    });

    const registrationFields = params.registration_fields ?? [];
    if (registrationFields.length > 0) {
      const pubgRegistrationFieldService = new PubgRegistrationFieldService();
      for (const field of registrationFields) {
        await pubgRegistrationFieldService.createPubgRegistrationField({
          tournamentId: tournament.id,
          label: field.label,
          type: field.type,
          options: field.options ?? null,
          required: field.required ?? true,
        });
      }
    }

    const chatService = new ChatService();
    await chatService.create({
      type: ChatType.CHANNEL,
      title: tournament.title,
      created_by: { id: params.createdById } as any,
      tournament: { id: tournament.id } as any,
      allow_user_messages: true,
    } as any);

    return tournament;
  }

  async updatePubgTournament(id: string | number, params: UpdatePubgTournamentParams) {
    const tournament = await this.getById(id) as Tournament;
    const pubgService = new PubgService();
    const pubgRegistrationFieldService = new PubgRegistrationFieldService();

    if (params.game !== undefined && Object.keys(params.game).length > 0) {
      const gameData: Record<string, unknown> = {};
      if (params.game.type !== undefined) gameData.type = params.game.type;
      if (params.game.map !== undefined) gameData.map = params.game.map;
      if (params.game.image !== undefined) gameData.image = params.game.image;
      await pubgService.update(tournament.game_ref_id, gameData);
    }

    const data: any = {};
    if (params.title !== undefined) data.title = params.title;
    if (params.description !== undefined) data.description = params.description;
    if (params.entry_fee !== undefined) data.entry_fee = params.entry_fee;
    if (params.prize_pool !== undefined) data.prize_pool = params.prize_pool;
    if (params.max_players !== undefined) data.max_players = params.max_players;
    if (params.start_date !== undefined) data.start_date = new Date(params.start_date);
    if (params.end_date !== undefined) data.end_date = new Date(params.end_date);
    if (params.is_active !== undefined) data.is_active = params.is_active;

    if (Object.keys(data).length > 0) {
      await this.update(id, data);
    }

    if (params.registration_fields !== undefined) {
      await pubgRegistrationFieldService.deleteByTournamentId(tournament.id);
      for (const field of params.registration_fields) {
        if (field.label != null && field.type != null) {
          await pubgRegistrationFieldService.createPubgRegistrationField({
            tournamentId: tournament.id,
            label: field.label,
            type: field.type,
            options: field.options ?? null,
            required: field.required ?? true,
          });
        }
      }
    }

    return await this.getById(id) as Tournament;
  }

  async deletePubgTournament(id: string | number) {
    const tournament = await this.getById(id) as Tournament;
    const pubgRegistrationFieldService = new PubgRegistrationFieldService();
    const pubgService = new PubgService();

    await pubgRegistrationFieldService.deleteByTournamentId(tournament.id);
    await this.delete(id);
    await pubgService.delete(tournament.game_ref_id);
  }

  async getPubgTournament(id: string | number) {
    const tournament = await this.getById(id) as Tournament;

    const pubgService = new PubgService();
    const game = await pubgService.getById(tournament.game_ref_id);

    const registrationFields = await this.getRegistrationFields(tournament.id);
    return {
      ...tournament,
      game,
      registration_fields: registrationFields,
    };
  }

  async getPubgTournaments(options: GetPubgTournamentsQueryDto) {
    const { page = 1, limit = 10, is_active } = options;
    const where: any = {};
    if (is_active !== undefined && is_active !== null) {
      where.is_active = is_active;
    }
    const data = await this.getAllWithPagination({ page, limit, where });

    const pubgService = new PubgService();

    const pubgRegistrationService = new PubgRegistrationService();

    data.data = await Promise.all(
      data.data.map(async (tournament: Tournament) => {
        const game = await pubgService.getById(tournament.game_ref_id);
        const registrationFields = await this.getRegistrationFields(tournament.id);
        const registered_count = await pubgRegistrationService.countByTournamentId(
          tournament.id
        );
        return {
          ...tournament,
          registration_fields: registrationFields,
          game,
          registered_count,
        };
      })
    );

    return data;
  }

  async getRegistrationFields(tournamentId: string | number) {
    await this.getById(tournamentId);
    const pubgRegistrationFieldService = new PubgRegistrationFieldService();
    const fields = await pubgRegistrationFieldService.findByTournamentId(
      typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId
    );
    return fields.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      options: f.options,
      required: f.required,
    }));
  }

  async registerForTournament(
    tournamentId: string | number,
    userId: number,
    fieldValues: { field_id: number; value: string }[],
    friends?: number[]
  ) {
    const tournament = await this.getById(tournamentId) as Tournament;
    const tid = typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId;
    const pubgRegistrationFieldService = new PubgRegistrationFieldService();
    const pubgRegistrationService = new PubgRegistrationService();
    const pubgRegistrationFieldValueService = new PubgRegistrationFieldValueService();
    const pubgService = new PubgService();
    const userService = new UserService();

    const fields = await pubgRegistrationFieldService.findByTournamentId(tid);
    const requiredFields = fields.filter((f) => f.required);
    for (const rf of requiredFields) {
      const fv = fieldValues.find((v) => v.field_id === rf.id);
      Ensure.required(fv?.value, rf.label);
    }

    const existing = await pubgRegistrationService.findByTournamentAndUser(tid, userId);
    Ensure.custom(!existing, "You are already registered for this tournament");

    Ensure.custom(tournament.is_active, "This tournament is no longer active");

    const user = await userService.findOneByCondition({ id: userId } as any);
    Ensure.exists(user, "user");
    const entryFee = Number(tournament.entry_fee) || 0;
    if (entryFee > 0) {
      Ensure.custom(
        Number(user!.coins) >= entryFee,
        "Insufficient balance to join this tournament"
      );
      await userService.deductCoins(userId, entryFee);
    }

    const game = await pubgService.getById(tournament.game_ref_id);
    Ensure.exists(game, "pubg game");

    // Solo registrations should ignore friends even if provided.
    let validFriendIds: number[] = [];
    if (game.type !== PubgType.SOLO) {
      const friendIds = Array.from(new Set((friends ?? []).filter((id) => id !== userId)));
      if (friendIds.length > 0) {
        const existingFriends = await userService.findManyByCondition({
          id: In(friendIds),
        } as any);
        Ensure.custom(
          existingFriends.length === friendIds.length,
          "One or more friends were not found"
        );
        validFriendIds = friendIds;
      }
    }

    const registration = await pubgRegistrationService.createPubgRegistration({
      tournamentId: tid,
      userId,
      friends: validFriendIds,
    });

    for (const fv of fieldValues) {
      await pubgRegistrationFieldValueService.create({
        registrationId: registration.id,
        fieldId: fv.field_id,
        value: fv.value,
      });
    }

    const chatService = new ChatService();
    const chat = await chatService.findByTournamentId(tid);
    Ensure.exists(chat, "tournament chat");
    const chatMemberService = new ChatMemberService();
    await chatMemberService.addMember(chat!.id, userId);

    return registration;
  }

  async assignWinners(tournamentId: string | number, userIds: number[]) {
    const tid = typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId;
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const tournament = await tournamentRepo.findOne({
      where: { id: tid },
      relations: ["winners"],
    });
    Ensure.exists(tournament, "tournament");

    const pubgRegistrationService = new PubgRegistrationService();
    for (const uid of userIds) {
      const reg = await pubgRegistrationService.findByTournamentAndUser(tid, uid);
      Ensure.custom(!!reg, `User ${uid} is not registered for this tournament`);
    }

    tournament!.winners = userIds.map((id) => ({ id }) as any);
    tournament!.is_active = false;
    await tournamentRepo.save(tournament!);

    return tournament;
  }

  async getRegistrations(tournamentId: string | number, page = 1, limit = 50) {
    const tid = typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId;
    await this.getById(tid);

    const pubgRegistrationService = new PubgRegistrationService();
    const skip = (page - 1) * limit;
    const [data, total] = await pubgRegistrationService.findByTournamentIdPaginated(tid, skip, limit);

    return { data, total, page, limit };
  }

  async removeRegistration(tournamentId: string | number, userId: number) {
    const tid = typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId;
    await this.getById(tid);

    const pubgRegistrationService = new PubgRegistrationService();
    const reg = await pubgRegistrationService.deleteByTournamentAndUser(tid, userId);
    Ensure.exists(reg, "registration");

    const chatService = new ChatService();
    const chat = await chatService.findByTournamentId(tid);
    if (chat) {
      const chatMemberService = new ChatMemberService();
      const member = await chatMemberService.findOneByCondition({
        chat_id: chat.id,
        user_id: userId,
      } as any);
      if (member) {
        await chatMemberService.delete((member as any).id);
      }
    }
  }

}
