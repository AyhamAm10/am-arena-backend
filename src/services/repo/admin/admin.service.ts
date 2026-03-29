import { ILike } from "typeorm";
import { AppDataSource } from "../../../config/data_source";
import { Ensure } from "../../../common/errors/Ensure.handler";
import { User } from "../../../entities/User";
import { Chat, ChatType } from "../../../entities/Chat";
import { ChatMember } from "../../../entities/ChatMember";
import { Message } from "../../../entities/Message";
import { Reel } from "../../../entities/Reel";
import { ReelComment } from "../../../entities/ReelComment";
import { Tournament } from "../../../entities/Tournament";
import { Achievement } from "../../../entities/Achievement";
import { PubgGame } from "../../../entities/PubgGame";
import type {
  GetAdminUsersQueryDto,
  UpdateAdminUserBalanceDto,
  UpdateAdminUserStatusDto,
} from "../../../dto/admin/admin-users.dto";
import type {
  CreateAdminChannelDto,
  UpdateAdminChannelDto,
} from "../../../dto/admin/admin-chat.dto";
import type { CreateAdminNotificationDto } from "../../../dto/admin/admin-notification.dto";
import type {
  CreateSuperTournamentDto,
  UpdateSuperTournamentDto,
} from "../../../dto/admin/admin-super-tournament.dto";
import { PubgRegistrationField } from "../../../entities/PubgRegistrationField";

const SYSTEM_NOTIFICATIONS_CHANNEL = "SYSTEM_NOTIFICATIONS";
const SUPER_TOURNAMENT_PREFIX = "[SUPER_TOURNAMENT]";

export class AdminService {
  async getUsers(query: GetAdminUsersQueryDto) {
    const repo = AppDataSource.getRepository(User);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const queryBuilder = repo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.full_name",
        "user.gamer_name",
        "user.email",
        "user.phone",
        "user.coins",
        "user.xp_points",
        "user.role",
        "user.is_active",
        "user.created_at",
      ])
      .orderBy("user.created_at", "DESC")
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.where(
        "user.full_name ILIKE :search OR user.gamer_name ILIKE :search OR user.email ILIKE :search",
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateUserStatus(userId: number, dto: UpdateAdminUserStatusDto) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    Ensure.exists(user, "user");
    user.is_active = dto.is_active;
    return repo.save(user);
  }

  async updateUserBalance(userId: number, dto: UpdateAdminUserBalanceDto) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    Ensure.exists(user, "user");

    user.coins = Number(user.coins || 0) + Number(dto.coins_delta || 0);
    user.xp_points = Number(user.xp_points || 0) + Number(dto.xp_delta || 0);

    return repo.save(user);
  }

  async getDashboardStats() {
    const [users, tournaments, reels, achievements, channels, notifications] = await Promise.all([
      AppDataSource.getRepository(User).count(),
      AppDataSource.getRepository(Tournament).count(),
      AppDataSource.getRepository(Reel).count(),
      AppDataSource.getRepository(Achievement).count(),
      AppDataSource.getRepository(Chat).count({
        where: { type: ChatType.CHANNEL },
      }),
      AppDataSource.getRepository(Message)
        .createQueryBuilder("message")
        .innerJoin("message.chat", "chat")
        .where("chat.title = :title", { title: SYSTEM_NOTIFICATIONS_CHANNEL })
        .getCount(),
    ]);

    const recentUsers = await AppDataSource.getRepository(User).find({
      select: {
        id: true,
        gamer_name: true,
        created_at: true,
      },
      order: { created_at: "DESC" },
      take: 5,
    });

    return {
      totals: {
        users,
        tournaments,
        reels,
        achievements,
        channels,
        notifications,
      },
      recent_users: recentUsers,
    };
  }

  async listChannels(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const chatRepo = AppDataSource.getRepository(Chat);
    const chatMemberRepo = AppDataSource.getRepository(ChatMember);
    const [channels, total] = await chatRepo.findAndCount({
      where: { type: ChatType.CHANNEL },
      order: { created_at: "DESC" },
      skip,
      take: limit,
      relations: ["created_by", "tournament"],
    });

    const data = await Promise.all(
      channels.map(async (channel) => {
        const memberCount = await chatMemberRepo.count({
          where: { chat: { id: channel.id } },
        });

        return {
          id: channel.id,
          title: channel.title,
          allow_user_messages: channel.allow_user_messages,
          tournament_id: channel.tournament?.id ?? null,
          member_count: memberCount,
          created_at: channel.created_at,
        };
      }),
    );

    return { data, total, page, limit };
  }

  async createChannel(currentUserId: number, dto: CreateAdminChannelDto) {
    const chatRepo = AppDataSource.getRepository(Chat);
    const chatMemberRepo = AppDataSource.getRepository(ChatMember);

    const channel = await chatRepo.save(
      chatRepo.create({
        type: ChatType.CHANNEL,
        title: dto.title,
        allow_user_messages: dto.allow_user_messages ?? true,
        created_by: { id: currentUserId } as User,
      }),
    );

    const uniqueMemberIds = Array.from(new Set(dto.member_ids ?? []));
    if (uniqueMemberIds.length > 0) {
      await chatMemberRepo.save(
        uniqueMemberIds.map((memberId) =>
          chatMemberRepo.create({
            chat: { id: channel.id } as Chat,
            user: { id: memberId } as User,
          }),
        ),
      );
    }

    return channel;
  }

  async updateChannel(channelId: number, dto: UpdateAdminChannelDto) {
    const chatRepo = AppDataSource.getRepository(Chat);
    const chatMemberRepo = AppDataSource.getRepository(ChatMember);
    const channel = await chatRepo.findOneBy({ id: channelId });
    Ensure.exists(channel, "channel");

    if (dto.title !== undefined) {
      channel.title = dto.title;
    }

    if (dto.allow_user_messages !== undefined) {
      channel.allow_user_messages = dto.allow_user_messages;
    }

    await chatRepo.save(channel);

    if (dto.member_ids !== undefined) {
      await chatMemberRepo.delete({ chat: { id: channelId } });
      const uniqueMemberIds = Array.from(new Set(dto.member_ids));

      if (uniqueMemberIds.length > 0) {
        await chatMemberRepo.save(
          uniqueMemberIds.map((memberId) =>
            chatMemberRepo.create({
              chat: { id: channelId } as Chat,
              user: { id: memberId } as User,
            }),
          ),
        );
      }
    }

    return channel;
  }

  async deleteChannel(channelId: number) {
    const chatRepo = AppDataSource.getRepository(Chat);
    const chatMemberRepo = AppDataSource.getRepository(ChatMember);
    const messageRepo = AppDataSource.getRepository(Message);

    const channel = await chatRepo.findOneBy({ id: channelId });
    Ensure.exists(channel, "channel");

    await chatMemberRepo.delete({ chat: { id: channelId } });
    await messageRepo.delete({ chat: { id: channelId } });
    await chatRepo.delete(channelId);
  }

  private async getOrCreateNotificationsChannel(currentUserId: number) {
    const repo = AppDataSource.getRepository(Chat);
    let channel = await repo.findOne({
      where: {
        title: SYSTEM_NOTIFICATIONS_CHANNEL,
        type: ChatType.CHANNEL,
      },
    });

    if (!channel) {
      channel = await repo.save(
        repo.create({
          title: SYSTEM_NOTIFICATIONS_CHANNEL,
          type: ChatType.CHANNEL,
          allow_user_messages: false,
          created_by: { id: currentUserId } as User,
        }),
      );
    }

    return channel;
  }

  async listNotifications(page = 1, limit = 50) {
    const messageRepo = AppDataSource.getRepository(Message);
    const skip = (page - 1) * limit;
    const [messages, total] = await messageRepo.findAndCount({
      where: {
        chat: {
          title: SYSTEM_NOTIFICATIONS_CHANNEL,
        },
      },
      relations: ["chat", "sender"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const data = messages.map((message) => {
      const parsed = safeParseNotification(message.content);

      return {
        id: message.id,
        title: parsed.title,
        description: parsed.description,
        type: parsed.type,
        created_at: message.created_at,
      };
    });

    return { data, total, page, limit };
  }

  async createNotification(currentUserId: number, dto: CreateAdminNotificationDto) {
    const channel = await this.getOrCreateNotificationsChannel(currentUserId);
    const repo = AppDataSource.getRepository(Message);

    return repo.save(
      repo.create({
        chat: { id: channel.id } as Chat,
        sender: { id: currentUserId } as User,
        content: JSON.stringify(dto),
      }),
    );
  }

  async deleteNotification(notificationId: number) {
    const repo = AppDataSource.getRepository(Message);
    const message = await repo.findOne({
      where: { id: notificationId },
      relations: ["chat"],
    });
    Ensure.exists(message, "notification");
    Ensure.custom(
      message.chat?.title === SYSTEM_NOTIFICATIONS_CHANNEL,
      "Notification not found",
    );
    await repo.delete(notificationId);
  }

  async updateReelAsAdmin(reelId: number, payload: Partial<Pick<Reel, "title" | "description" | "video_url">>) {
    const repo = AppDataSource.getRepository(Reel);
    const reel = await repo.findOneBy({ id: reelId });
    Ensure.exists(reel, "reel");
    Object.assign(reel, payload);
    return repo.save(reel);
  }

  async deleteReelAsAdmin(reelId: number) {
    const reelRepo = AppDataSource.getRepository(Reel);
    const commentRepo = AppDataSource.getRepository(ReelComment);
    const reel = await reelRepo.findOneBy({ id: reelId });
    Ensure.exists(reel, "reel");
    await commentRepo.delete({ reel: { id: reelId } });
    await reelRepo.delete(reelId);
  }

  async listSuperTournaments(page = 1, limit = 50) {
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const gameRepo = AppDataSource.getRepository(PubgGame);
    const fieldsRepo = AppDataSource.getRepository(PubgRegistrationField);
    const skip = (page - 1) * limit;
    const [tournaments, total] = await tournamentRepo.findAndCount({
      where: { game_type: "super_pubg" },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const data = await Promise.all(
      tournaments.map(async (tournament) => {
        const game = await gameRepo.findOneBy({ id: tournament.game_ref_id });
        const registrationFields = await fieldsRepo.find({
          where: { tournament: { id: tournament.id } },
        });
        const { description, min_xp_required } = decodeSuperTournamentDescription(
          tournament.description,
        );

        return {
          ...tournament,
          description,
          min_xp_required,
          game,
          registration_fields: registrationFields,
        };
      }),
    );

    return { data, total, page, limit };
  }

  async createSuperTournament(currentUserId: number, dto: CreateSuperTournamentDto) {
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const gameRepo = AppDataSource.getRepository(PubgGame);
    const fieldsRepo = AppDataSource.getRepository(PubgRegistrationField);

    const game = await gameRepo.save(
      gameRepo.create({
        type: dto.game.type as PubgGame["type"],
        map: dto.game.map,
        image: dto.game.image || "",
      } as Partial<PubgGame>),
    );

    const tournament = await tournamentRepo.save(
      tournamentRepo.create({
        game_type: "super_pubg",
        game_ref_id: game.id,
        title: dto.title,
        description: encodeSuperTournamentDescription(dto.description, dto.min_xp_required),
        entry_fee: dto.entry_fee,
        prize_pool: dto.prize_pool,
        max_players: dto.max_players,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        is_active: dto.is_active ?? true,
        created_by: { id: currentUserId } as User,
      }),
    );

    if (dto.registration_fields.length > 0) {
      await fieldsRepo.save(
        dto.registration_fields.map((field) =>
          fieldsRepo.create({
            tournament: { id: tournament.id } as Tournament,
            label: field.label,
            type: field.type,
            options: field.options ?? null,
            required: field.required ?? true,
          }),
        ),
      );
    }

    return tournament;
  }

  async updateSuperTournament(tournamentId: number, dto: UpdateSuperTournamentDto) {
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const gameRepo = AppDataSource.getRepository(PubgGame);
    const fieldsRepo = AppDataSource.getRepository(PubgRegistrationField);
    const tournament = await tournamentRepo.findOneBy({ id: tournamentId, game_type: "super_pubg" as any });
    Ensure.exists(tournament, "super tournament");

    if (dto.game) {
      const game = await gameRepo.findOneBy({ id: tournament.game_ref_id });
      Ensure.exists(game, "pubg game");

      if (dto.game.type !== undefined) {
        game.type = dto.game.type as any;
      }
      if (dto.game.map !== undefined) {
        game.map = dto.game.map;
      }
      if (dto.game.image !== undefined) {
        game.image = dto.game.image;
      }

      await gameRepo.save(game);
    }

    const decoded = decodeSuperTournamentDescription(tournament.description);
    if (dto.title !== undefined) tournament.title = dto.title;
    if (dto.entry_fee !== undefined) tournament.entry_fee = dto.entry_fee;
    if (dto.prize_pool !== undefined) tournament.prize_pool = dto.prize_pool;
    if (dto.max_players !== undefined) tournament.max_players = dto.max_players;
    if (dto.start_date !== undefined) tournament.start_date = dto.start_date ? new Date(dto.start_date) : null;
    if (dto.end_date !== undefined) tournament.end_date = dto.end_date ? new Date(dto.end_date) : null;
    if (dto.is_active !== undefined) tournament.is_active = dto.is_active;

    tournament.description = encodeSuperTournamentDescription(
      dto.description ?? decoded.description,
      dto.min_xp_required ?? decoded.min_xp_required,
    );

    await tournamentRepo.save(tournament);

    if (dto.registration_fields !== undefined) {
      await fieldsRepo.delete({ tournament: { id: tournamentId } });
      const validFields = dto.registration_fields.filter(
        (field) => field.label && field.type,
      );

      if (validFields.length > 0) {
        await fieldsRepo.save(
          validFields.map((field) =>
            fieldsRepo.create({
              tournament: { id: tournamentId } as Tournament,
              label: field.label!,
              type: field.type!,
              options: field.options ?? null,
              required: field.required ?? true,
            }),
          ),
        );
      }
    }

    return tournament;
  }

  async deleteSuperTournament(tournamentId: number) {
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const gameRepo = AppDataSource.getRepository(PubgGame);
    const fieldsRepo = AppDataSource.getRepository(PubgRegistrationField);
    const tournament = await tournamentRepo.findOneBy({ id: tournamentId, game_type: "super_pubg" as any });
    Ensure.exists(tournament, "super tournament");

    await fieldsRepo.delete({ tournament: { id: tournamentId } });
    await tournamentRepo.delete(tournamentId);
    await gameRepo.delete(tournament.game_ref_id);
  }
}

function safeParseNotification(content: string) {
  try {
    const parsed = JSON.parse(content) as {
      title?: string;
      description?: string;
      type?: string;
    };

    return {
      title: parsed.title || "Untitled notification",
      description: parsed.description || "",
      type: parsed.type || "info",
    };
  } catch {
    return {
      title: "Untitled notification",
      description: content,
      type: "info",
    };
  }
}

function encodeSuperTournamentDescription(description: string, minXpRequired: number) {
  return `${SUPER_TOURNAMENT_PREFIX}${minXpRequired}\n${description}`;
}

function decodeSuperTournamentDescription(value: string) {
  if (!value.startsWith(SUPER_TOURNAMENT_PREFIX)) {
    return {
      description: value,
      min_xp_required: 0,
    };
  }

  const [header, ...descriptionLines] = value.split("\n");
  const minXp = Number(header.replace(SUPER_TOURNAMENT_PREFIX, "")) || 0;

  return {
    description: descriptionLines.join("\n"),
    min_xp_required: minXp,
  };
}
