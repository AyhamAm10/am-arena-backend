import { Ensure } from "../../../common/errors/Ensure.handler";
import { decodeSuperTournamentDescription } from "../../../common/utils/super-tournament-description";
import { Tournament } from "../../../entities/Tournament";
import { User } from "../../../entities/User";
import { Chat, ChatType } from "../../../entities/Chat";
import { RepoService } from "../../repo.service";
import { CreatePubgTournamentDto } from "../../../dto/pubg-tournament/create-pubg-tournament.dto";
import { UpdatePubgTournamentDto } from "../../../dto/pubg-tournament/update-pubg-tournament.dto";
import { GetPubgTournamentsQueryDto } from "../../../dto/pubg-tournament/get-pubg-tournaments-query.dto";
import { PubgService } from "../pubg/pubg.service";
import { PubgRegistrationFieldService } from "../pubg-registration-field/pubg-registration-field.service";
import { PubgRegistrationService } from "../pubg-registration/pubg-registration.service";
import { ChatService } from "../chat/chat.service";
import { ChatMemberService } from "../chat-member/chat-member.service";
import { UserService } from "../user/user.service";
import { NotificationService } from "../notification/notification.service";
import { PollService } from "../poll/poll.service";
import { PubgGame, PubgType } from "../../../entities/PubgGame";
import { AppDataSource } from "../../../config/data_source";
import { PubgRegistration } from "../../../entities/PubgRegistration";
import { PubgRegistrationField } from "../../../entities/PubgRegistrationField";
import { PubgRegistrationFieldValue } from "../../../entities/PubgRegistrationFieldValue";
import { ChatMember } from "../../../entities/ChatMember";
import { Wallet } from "../../../entities/wallet";
import { WalletTransaction } from "../../../entities/wallet_transaction";
import { In } from "typeorm";
import { mapPubgGameForResponse } from "../../../utils/pubg-game-response";
import { Achievement, AchievementType } from "../../../entities/Achievement";
import { Poll } from "../../../entities/Poll";
import { PollOption } from "../../../entities/PollOption";
import { Vote } from "../../../entities/Vote";
import { AchievementService } from "../achievement/achievement.service";
import { UserAchievementService } from "../user-achievement/user-achievement.service";

type CreatePubgTournamentParams = CreatePubgTournamentDto & {
  createdById: number;
  image: string;
  image_public_id?: string | null;
};
type UpdatePubgTournamentParams = UpdatePubgTournamentDto;

const TOURNAMENT_CHAMPION_TEMPLATE = {
  name: "سيد البطولة",
  icon_url:
    "https://res.cloudinary.com/dqonojdwr/image/upload/v1777388070/icons/1777388069285-svg-icon_-tournament-champion.svg",
  icon_public_id: "icons/1777388069285-svg-icon_-tournament-champion",
  color_theme: "#E9C400",
} as const;

const AUDIENCE_CHAMPION_TEMPLATE = {
  name: "نجم التصويت",
  icon_url:
    "https://res.cloudinary.com/dqonojdwr/image/upload/v1777388664/icons/1777388663717-svg-icon_-audience-champion.svg",
  icon_public_id: "icons/1777388663717-svg-icon_-audience-champion",
  color_theme: "#10b981",
} as const;

const SURVIVOR_TEMPLATE = {
  name: "سيد النجاة",
  icon_url:
    "https://res.cloudinary.com/dqonojdwr/image/upload/v1777464212/icons/1777464211089-svg.png",
  icon_public_id: "icons/1777464211089-svg",
  color_theme: "#00F2FF",
} as const;

function autoAchievementXpFromTournament(
  tournament: Tournament,
  ratePercent: number
): number {
  const tournamentXp = Math.max(0, Math.trunc(Number(tournament.Xp_condition) || 0));
  if (tournamentXp <= 0) return 0;
  const ratio = Math.max(0, Number(ratePercent) || 0) / 100;
  return Math.max(1, Math.round(tournamentXp * ratio));
}

function safeTournamentWinnerSummaries(
  winners: User[] | undefined
): { id: number; gamer_name: string }[] {
  if (!Array.isArray(winners)) return [];
  return winners.map((w) => ({ id: w.id, gamer_name: w.gamer_name }));
}

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
    this.assignSurvivors = this.assignSurvivors.bind(this);
    this.getRegistrations = this.getRegistrations.bind(this);
    this.removeRegistration = this.removeRegistration.bind(this);
  }

  async createPubgTournament(params: CreatePubgTournamentParams) {
    Ensure.required(params.createdById, "created_by");

    const pubgService = new PubgService();
    const game = await pubgService.createPubgGame({
      image: params.image,
      image_public_id: params.image_public_id ?? null,
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

    await this.ensureTournamentAutomation(tournament.id);

    if (params.notify_all_users) {
      const notificationService = new NotificationService();
      await notificationService.notifyTournamentCreated(tournament.id, tournament.title);
    }

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
      if (params.game.image_public_id !== undefined) {
        gameData.image_public_id = params.game.image_public_id;
      }
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
    let tournament = await this.getById(id) as Tournament;
    tournament = await this.finalizeTournamentLifecycleIfNeeded(tournament);

    const pubgService = new PubgService();
    const game = await pubgService.getById(tournament.game_ref_id);

    const registrationFields = await this.getRegistrationFields(tournament.id);
    const pollService = new PollService();
    const polls = await pollService.getTournamentPolls(tournament.id);
    return {
      ...tournament,
      game: mapPubgGameForResponse(game),
      registration_fields: registrationFields,
      polls,
    };
  }

  async getPubgTournaments(options: GetPubgTournamentsQueryDto) {
    const { page = 1, limit = 10, is_active, is_super } = options;
    const where: any = {};
    if (is_active !== undefined && is_active !== null) {
      where.is_active = is_active;
    }
    if (is_super !== undefined && is_super !== null) {
      where.is_super = is_super;
    }

    const loadWinners = is_active === false;
    const order =
      is_active === false
        ? ({ updated_at: "DESC" } as const)
        : ({ start_date: "ASC", id: "DESC" } as const);

    const data = await this.getAllWithPagination({
      page,
      limit,
      where,
      relations: loadWinners ? (["winners"] as any) : undefined,
      order: order as any,
    });

    const tournamentIds = data.data.map((tournament) => tournament.id);
    const gameIds = Array.from(
      new Set(data.data.map((tournament) => Number(tournament.game_ref_id)).filter(Boolean))
    );
    const [games, fields, registrationCounts] = await Promise.all([
      gameIds.length > 0
        ? AppDataSource.getRepository(PubgGame).find({
            where: { id: In(gameIds) },
          })
        : [],
      tournamentIds.length > 0
        ? AppDataSource.getRepository(PubgRegistrationField).find({
            where: { tournament: { id: In(tournamentIds) } } as any,
            relations: ["tournament"],
          })
        : [],
      tournamentIds.length > 0
        ? AppDataSource.getRepository(PubgRegistration)
            .createQueryBuilder("registration")
            .select('"registration"."tournamentId"', "tournament_id")
            .addSelect("COUNT(*)", "registered_count")
            .where('"registration"."tournamentId" IN (:...tournamentIds)', {
              tournamentIds,
            })
            .groupBy('"registration"."tournamentId"')
            .getRawMany<{ tournament_id: string; registered_count: string }>()
        : [],
    ]);

    const gamesById = new Map<number, PubgGame>();
    for (const game of games) {
      gamesById.set(Number(game.id), game);
    }
    const fieldsByTournamentId = new Map<number, Array<{
      id: number;
      label: string;
      type: string;
      options: unknown;
      required: boolean;
    }>>();
    for (const field of fields) {
      const tournamentId = Number((field.tournament as Tournament | undefined)?.id);
      const existing = fieldsByTournamentId.get(tournamentId) ?? [];
      existing.push({
        id: field.id,
        label: field.label,
        type: field.type,
        options: field.options,
        required: field.required,
      });
      fieldsByTournamentId.set(tournamentId, existing);
    }
    const countsByTournamentId = new Map<number, number>();
    for (const row of registrationCounts) {
      countsByTournamentId.set(
        Number(row.tournament_id),
        Number(row.registered_count),
      );
    }

    const normalizedRows = await Promise.all(
      data.data.map(async (tournament: Tournament) =>
        this.finalizeTournamentLifecycleIfNeeded(tournament)
      )
    );

    const rows = normalizedRows.map((tournament: Tournament) => {
      const participantCount = countsByTournamentId.get(tournament.id) ?? 0;
      const result: Record<string, unknown> = {
        ...tournament,
        registration_fields: fieldsByTournamentId.get(tournament.id) ?? [],
        game: mapPubgGameForResponse(
          gamesById.get(Number(tournament.game_ref_id)) ?? null,
        ),
        registered_count: participantCount,
        participant_count: participantCount,
      };
      delete result.winners;
      result.winners = safeTournamentWinnerSummaries(
        (tournament as Tournament & { winners?: User[] }).winners
      );

      if (tournament.is_super && tournament.description) {
        const decoded = decodeSuperTournamentDescription(tournament.description);
        result.description = decoded.description;
        result.min_xp_required = decoded.min_xp_required;
      }

      return result;
    });

    return { ...data, data: rows };
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
    let tournament = await this.getById(tournamentId) as Tournament;
    tournament = await this.finalizeTournamentLifecycleIfNeeded(tournament);
    const tid = typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId;
    const pubgRegistrationFieldService = new PubgRegistrationFieldService();
    const pubgService = new PubgService();
    const userService = new UserService();

    const fields = await pubgRegistrationFieldService.findByTournamentId(tid);
    const requiredFields = fields.filter((f) => f.required);
    for (const rf of requiredFields) {
      const fv = fieldValues.find((v) => v.field_id === rf.id);
      Ensure.required(fv?.value, rf.label);
    }

    Ensure.custom(tournament.is_active, "This tournament is no longer active");

    const game = await pubgService.getById(tournament.game_ref_id);
    Ensure.exists(game, "pubg game");

    let validFriendIds: number[] = [];
    if (game?.type !== PubgType.SOLO) {
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

    let xpRequired = Math.max(0, Math.trunc(Number(tournament.Xp_condition) || 0));
    if (tournament.is_super && typeof tournament.description === "string") {
      const { min_xp_required } = decodeSuperTournamentDescription(tournament.description);
      xpRequired = Math.max(xpRequired, Math.max(0, Math.trunc(Number(min_xp_required) || 0)));
    }

    const entryFee = Number(tournament.entry_fee) || 0;

    const registration = await AppDataSource.manager.transaction(async (manager) => {
      await manager.query(
        "SELECT pg_advisory_xact_lock($1::integer, $2::integer)",
        [tid, 0]
      );
      await manager.query(
        "SELECT pg_advisory_xact_lock($1::integer, $2::integer)",
        [tid, userId]
      );

      const existing = await manager.getRepository(PubgRegistration).findOne({
        where: { tournament: { id: tid }, user: { id: userId } } as any,
      });
      Ensure.custom(!existing, "You are already registered for this tournament");

      const tLocked = await manager.getRepository(Tournament).findOne({ where: { id: tid } });
      Ensure.exists(tLocked, "tournament");
      Ensure.custom(tLocked!.is_active, "This tournament is no longer active");
      const maxPlayers = Number(tLocked!.max_players || 0);
      if (maxPlayers > 0) {
        const registrationCount = await manager.getRepository(PubgRegistration).count({
          where: { tournament: { id: tid } } as any,
        });
        Ensure.custom(registrationCount < maxPlayers, "This tournament is full");
      }

      const userEntity = await manager
        .getRepository(User)
        .createQueryBuilder("u")
        .setLock("pessimistic_write")
        .where("u.id = :uid", { uid: userId })
        .getOne();
      Ensure.exists(userEntity, "user");

      if (xpRequired > 0) {
        const userXp = Math.max(0, Math.trunc(Number(userEntity!.xp_points) || 0));
        Ensure.custom(
          userXp >= xpRequired,
          `Insufficient XP to join this tournament (required ${xpRequired} XP, you have ${userXp})`
        );
      }

      if (entryFee > 0) {
        Ensure.custom(
          Number(userEntity!.coins) >= entryFee,
          "Insufficient balance to join this tournament"
        );
        userEntity!.coins = Number(userEntity!.coins || 0) - entryFee;
        await manager.getRepository(User).save(userEntity!);

        const walletRepo = manager.getRepository(Wallet);
        const txRepo = manager.getRepository(WalletTransaction);
        let wallet = await walletRepo.findOne({
          where: { user: { id: userId } } as any,
          relations: ["user"],
        });
        if (!wallet) {
          wallet = walletRepo.create({
            user: { id: userId } as User,
            balance: Number(userEntity!.coins || 0),
          });
        } else {
          wallet.balance = Number(userEntity!.coins || 0);
        }
        await walletRepo.save(wallet);
        await txRepo.save(
          txRepo.create({
            user: { id: userId } as User,
            amount: entryFee,
            type: "spend",
            status: "approved",
            tournament: { id: tid } as Tournament,
          }),
        );
      }

      const regRepo = manager.getRepository(PubgRegistration);
      const registration = regRepo.create({
        tournament: { id: tid } as Tournament,
        user: { id: userId } as User,
        friends: validFriendIds.map((id) => ({ id }) as User),
        paid: entryFee > 0,
        payment_method: entryFee > 0 ? "coins" : undefined,
        registered_at: new Date(),
      } as any) as unknown as PubgRegistration;
      await regRepo.save(registration);

      const fvRepo = manager.getRepository(PubgRegistrationFieldValue);
      for (const fv of fieldValues) {
        await fvRepo.save(
          fvRepo.create({
            registration: { id: registration.id } as PubgRegistration,
            field: { id: fv.field_id } as any,
            value: fv.value,
          } as any)
        );
      }

      const chatService = new ChatService();
      const chat = await chatService.findByTournamentId(tid);
      Ensure.exists(chat, "tournament chat");
      const cmRepo = manager.getRepository(ChatMember);
      const alreadyMember = await cmRepo.findOne({
        where: { chat_id: chat!.id, user_id: userId } as any,
      });
      Ensure.custom(!alreadyMember, "User is already a member of this chat");
      await cmRepo.save(
        cmRepo.create({
          chat_id: chat!.id,
          user_id: userId,
        } as any)
      );

      return registration;
    });

    await this.ensureParticipantPollOption(tid, userId);
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

    if (userIds.length > 0) {
      const registrations = await AppDataSource.getRepository(PubgRegistration).find({
        where: {
          tournament: { id: tid },
          user: { id: In(userIds) },
        } as any,
        relations: ["user"],
      });
      const registeredUserIds = new Set(
        registrations.map((registration) => Number(registration.user?.id)),
      );
      for (const uid of userIds) {
        Ensure.custom(
          registeredUserIds.has(Number(uid)),
          `User ${uid} is not registered for this tournament`
        );
      }
    }

    tournament!.winners = userIds.map((id) => ({ id }) as any);
    tournament!.is_active = false;
    await tournamentRepo.save(tournament!);

    if (userIds.length > 0) {
      const notificationService = new NotificationService();
      const title = "Tournament result";
      const body = `You won: ${tournament!.title}`;
      await notificationService.notifySystemUsers(userIds, title, body, {
        tournamentId: tid,
      });
    }

    await this.finalizeTournamentLifecycle(tid, userIds);
    return tournament;
  }

  async assignSurvivors(tournamentId: string | number, userIds: number[]) {
    const tid = typeof tournamentId === "string" ? parseInt(tournamentId, 10) : tournamentId;
    const deduped = Array.from(
      new Set(userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))
    );
    Ensure.custom(deduped.length > 0, "At least one survivor is required");
    Ensure.custom(deduped.length <= 5, "A maximum of five survivors is allowed");

    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const tournament = await tournamentRepo.findOne({ where: { id: tid } });
    Ensure.exists(tournament, "tournament");

    await this.ensureTournamentAutomation(tid);
    const refreshed = await tournamentRepo.findOne({ where: { id: tid } });
    Ensure.exists(refreshed, "tournament");
    Ensure.exists(refreshed!.survivor_achievement_id, "survivor achievement");

    const registrations = await AppDataSource.getRepository(PubgRegistration).find({
      where: {
        tournament: { id: tid },
        user: { id: In(deduped) },
      } as any,
      relations: ["user"],
    });
    const registeredUserIds = new Set(
      registrations.map((registration) => Number(registration.user?.id))
    );
    for (const uid of deduped) {
      Ensure.custom(
        registeredUserIds.has(Number(uid)),
        `User ${uid} is not registered for this tournament`
      );
    }

    const achievementService = new AchievementService();
    const userAchievementService = new UserAchievementService();
    for (const uid of deduped) {
      const existing = await userAchievementService.findByUserAndAchievement(
        uid,
        refreshed!.survivor_achievement_id as number
      );
      if (!existing) {
        await achievementService.assignToUser(
          refreshed!.survivor_achievement_id as number,
          uid
        );
      }
    }

    return refreshed;
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

    await AppDataSource.manager.transaction(async (manager) => {
      await manager.query(
        "SELECT pg_advisory_xact_lock($1::integer, $2::integer)",
        [tid, userId]
      );

      const regRepo = manager.getRepository(PubgRegistration);
      const reg = await regRepo.findOne({
        where: { tournament: { id: tid }, user: { id: userId } } as any,
        relations: ["tournament", "user"],
      });
      Ensure.exists(reg, "registration");

      await regRepo.remove(reg!);

      const entryFee = Number(reg!.tournament?.entry_fee || 0);
      if (reg!.paid && entryFee > 0) {
        const userEntity = await manager
          .getRepository(User)
          .createQueryBuilder("u")
          .setLock("pessimistic_write")
          .where("u.id = :uid", { uid: userId })
          .getOne();
        Ensure.exists(userEntity, "user");

        userEntity!.coins = Number(userEntity!.coins || 0) + entryFee;
        await manager.getRepository(User).save(userEntity!);

        const walletRepo = manager.getRepository(Wallet);
        const txRepo = manager.getRepository(WalletTransaction);
        let wallet = await walletRepo.findOne({
          where: { user: { id: userId } } as any,
          relations: ["user"],
        });
        if (!wallet) {
          wallet = walletRepo.create({
            user: { id: userId } as User,
            balance: Number(userEntity!.coins || 0),
          });
        } else {
          wallet.balance = Number(userEntity!.coins || 0);
        }
        await walletRepo.save(wallet);
        await txRepo.save(
          txRepo.create({
            user: { id: userId } as User,
            amount: entryFee,
            type: "refund",
            status: "approved",
            tournament: { id: tid } as Tournament,
          }),
        );
      }

      const chat = await manager.getRepository(Chat).findOne({
        where: { tournament: { id: tid } } as any,
      });
      if (chat) {
        await manager.getRepository(ChatMember).delete({
          chat_id: chat.id,
          user_id: userId,
        } as any);
      }
    });
  }

  async ensureTournamentAutomation(tournamentId: number) {
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const achievementRepo = AppDataSource.getRepository(Achievement);
    const pollRepo = AppDataSource.getRepository(Poll);
    const optionRepo = AppDataSource.getRepository(PollOption);
    const registrationRepo = AppDataSource.getRepository(PubgRegistration);

    const tournament = await tournamentRepo.findOne({ where: { id: tournamentId } });
    Ensure.exists(tournament, "tournament");
    const autoAchievementXp = autoAchievementXpFromTournament(tournament!, 0.2);
    const survivorAchievementXp = autoAchievementXpFromTournament(tournament!, 10);

    let changed = false;

    if (!tournament!.champion_achievement_id) {
      const achievementService = new AchievementService();
      const created = (await achievementService.createAchievement({
        name: TOURNAMENT_CHAMPION_TEMPLATE.name,
        description: `قم بالانتصار في بطولة ${tournament!.title}`,
        color_theme: TOURNAMENT_CHAMPION_TEMPLATE.color_theme,
        icon_url: TOURNAMENT_CHAMPION_TEMPLATE.icon_url,
        icon_public_id: TOURNAMENT_CHAMPION_TEMPLATE.icon_public_id,
        type: AchievementType.CUSTOM,
        logic_type: "manual",
        xp_reward: autoAchievementXp,
      })) as Achievement;
      tournament!.champion_achievement_id = created.id;
      changed = true;
    } else {
      const championAchievement = await achievementRepo.findOne({
        where: { id: tournament!.champion_achievement_id },
      });
      Ensure.exists(championAchievement, "tournament champion achievement");
    }

    if (!tournament!.audience_achievement_id) {
      const achievementService = new AchievementService();
      const created = (await achievementService.createAchievement({
        name: AUDIENCE_CHAMPION_TEMPLATE.name,
        description: `حصل على أعلى تصويت جماهيري في بطولة ${tournament!.title}`,
        color_theme: AUDIENCE_CHAMPION_TEMPLATE.color_theme,
        icon_url: AUDIENCE_CHAMPION_TEMPLATE.icon_url,
        icon_public_id: AUDIENCE_CHAMPION_TEMPLATE.icon_public_id,
        type: AchievementType.CUSTOM,
        logic_type: "manual",
        xp_reward: autoAchievementXp,
      })) as Achievement;
      tournament!.audience_achievement_id = created.id;
      changed = true;
    } else {
      const audienceAchievement = await achievementRepo.findOne({
        where: { id: tournament!.audience_achievement_id },
      });
      Ensure.exists(audienceAchievement, "tournament audience achievement");
    }

    if (!tournament!.survivor_achievement_id) {
      const achievementService = new AchievementService();
      const created = (await achievementService.createAchievement({
        name: SURVIVOR_TEMPLATE.name,
        description: `وصل إلى قائمة أفضل الناجين في بطولة ${tournament!.title}`,
        color_theme: SURVIVOR_TEMPLATE.color_theme,
        icon_url: SURVIVOR_TEMPLATE.icon_url,
        icon_public_id: SURVIVOR_TEMPLATE.icon_public_id,
        type: AchievementType.CUSTOM,
        logic_type: "manual",
        xp_reward: survivorAchievementXp,
      })) as Achievement;
      tournament!.survivor_achievement_id = created.id;
      changed = true;
    } else {
      const survivorAchievement = await achievementRepo.findOne({
        where: { id: tournament!.survivor_achievement_id },
      });
      Ensure.exists(survivorAchievement, "tournament survivor achievement");
    }

    if (!tournament!.audience_poll_id) {
      const poll = await pollRepo.save(
        pollRepo.create({
          title: `أفضل لاعب - ${tournament!.title}`,
          description: `تصويت الجمهور لأفضل لاعب في بطولة ${tournament!.title}`,
          type: "tournament",
          tournament: { id: tournament!.id } as Tournament,
          expires_at: tournament!.end_date ?? null,
          is_active: true,
        })
      );
      tournament!.audience_poll_id = poll.id;
      changed = true;

      const registrations = await registrationRepo.find({
        where: { tournament: { id: tournament!.id } } as any,
        relations: ["user"],
      });
      if (registrations.length > 0) {
        const seen = new Set<number>();
        const options = registrations
          .map((row) => Number(row.user?.id))
          .filter((userId) => Number.isInteger(userId) && userId > 0)
          .filter((userId) => {
            if (seen.has(userId)) return false;
            seen.add(userId);
            return true;
          })
          .map((userId) =>
            optionRepo.create({
              poll: { id: poll.id } as Poll,
              type: "user",
              user: { id: userId } as User,
              label: undefined,
            } as any) as unknown as PollOption
          );
        if (options.length > 0) {
          await optionRepo.save(options);
        }
      }
    } else {
      const poll = await pollRepo.findOne({
        where: { id: tournament!.audience_poll_id },
      });
      Ensure.exists(poll, "tournament audience poll");
    }

    if (changed) {
      await tournamentRepo.save(tournament!);
    }
  }

  async finalizeTournamentIfEnded(tournamentId: number) {
    const tournament = await this.getById(tournamentId) as Tournament;
    await this.finalizeTournamentLifecycleIfNeeded(tournament);
  }

  private async ensureParticipantPollOption(tournamentId: number, userId: number) {
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const pollOptionRepo = AppDataSource.getRepository(PollOption);
    const tournament = await tournamentRepo.findOne({ where: { id: tournamentId } });
    Ensure.exists(tournament, "tournament");

    if (!tournament!.audience_poll_id) {
      await this.ensureTournamentAutomation(tournamentId);
    }

    const refreshed = await tournamentRepo.findOne({ where: { id: tournamentId } });
    Ensure.exists(refreshed, "tournament");
    Ensure.exists(refreshed!.audience_poll_id, "tournament audience poll");

    const existing = await pollOptionRepo.findOne({
      where: {
        poll: { id: refreshed!.audience_poll_id as number },
        user: { id: userId },
      } as any,
    });
    if (existing) return;

    await pollOptionRepo.save(
      pollOptionRepo.create({
        poll: { id: refreshed!.audience_poll_id as number } as Poll,
        type: "user",
        user: { id: userId } as User,
        label: undefined,
      } as any)
    );
  }

  private async finalizeTournamentLifecycleIfNeeded(tournament: Tournament) {
    if (!tournament.is_active) return tournament;
    if (!tournament.end_date) return tournament;
    const endAt = new Date(tournament.end_date).getTime();
    if (Number.isNaN(endAt) || endAt > Date.now()) return tournament;

    await this.finalizeTournamentLifecycle(tournament.id, []);
    const refreshed = await this.getById(tournament.id) as Tournament;
    return refreshed;
  }

  private async finalizeTournamentLifecycle(tournamentId: number, manualWinnerIds: number[]) {
    await this.ensureTournamentAutomation(tournamentId);
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const pollRepo = AppDataSource.getRepository(Poll);
    const voteRepo = AppDataSource.getRepository(Vote);
    const achievementService = new AchievementService();
    const userAchievementService = new UserAchievementService();

    const tournament = await tournamentRepo.findOne({
      where: { id: tournamentId },
      relations: ["winners"],
    });
    Ensure.exists(tournament, "tournament");

    if (tournament!.audience_poll_id) {
      const poll = await pollRepo.findOne({ where: { id: tournament!.audience_poll_id } });
      if (poll && poll.is_active) {
        poll.is_active = false;
        await pollRepo.save(poll);
      }
    }

    if (tournament!.is_active) {
      tournament!.is_active = false;
      await tournamentRepo.save(tournament!);
    }

    const championAchievementId = tournament!.champion_achievement_id;
    const audienceAchievementId = tournament!.audience_achievement_id;
    Ensure.exists(championAchievementId, "champion achievement");
    Ensure.exists(audienceAchievementId, "audience achievement");

    const championWinnerIds =
      manualWinnerIds.length > 0
        ? manualWinnerIds
        : (tournament!.winners ?? []).map((winner) => Number(winner.id));
    for (const championWinnerId of championWinnerIds) {
      if (!Number.isInteger(championWinnerId) || championWinnerId <= 0) continue;
      const existingChampion = await userAchievementService.findByUserAndAchievement(
        championWinnerId,
        championAchievementId as number
      );
      if (!existingChampion) {
        await achievementService.assignToUser(championAchievementId as number, championWinnerId);
      }
    }

    if (tournament!.audience_poll_id) {
      const topOptionRow = await voteRepo
        .createQueryBuilder("vote")
        .select('"vote"."optionId"', "optionId")
        .addSelect("COUNT(*)", "count")
        .where('"vote"."pollId" = :pollId', { pollId: tournament!.audience_poll_id })
        .groupBy('"vote"."optionId"')
        .orderBy("COUNT(*)", "DESC")
        .addOrderBy('"vote"."optionId"', "ASC")
        .limit(1)
        .getRawOne<{ optionId: string }>();

      if (topOptionRow?.optionId) {
        const pollOptionRepo = AppDataSource.getRepository(PollOption);
        const winningOption = await pollOptionRepo.findOne({
          where: { id: Number(topOptionRow.optionId) },
          relations: ["user"],
        });
        const audienceWinnerId = Number(winningOption?.user?.id ?? 0);
        if (audienceWinnerId > 0) {
          const existingAudience = await userAchievementService.findByUserAndAchievement(
            audienceWinnerId,
            audienceAchievementId as number
          );
          if (!existingAudience) {
            await achievementService.assignToUser(
              audienceAchievementId as number,
              audienceWinnerId
            );
          }
        }
      }
    }
  }

}
