import { Ensure } from "../../../common/errors/Ensure.handler";
import { ErrorMessages } from "../../../common/errors/ErrorMessages";
import { getLanguage } from "../../../middlewares/lang.middleware";
import { ILike, In, Not } from "typeorm";
import { AppDataSource } from "../../../config/data_source";
import { Friend } from "../../../entities/Friend";
import { PubgRegistration } from "../../../entities/PubgRegistration";
import { Tournament } from "../../../entities/Tournament";
import { User } from "../../../entities/User";
import { Achievement } from "../../../entities/Achievement";
import { RepoService } from "../../repo.service";
import { GetBestUsersQueryDto } from "../../../dto/user/get-best-users-query.dto";
import { SearchUsersQueryDto } from "../../../dto/user/search-users-query.dto";
import { ProfileUpdateDto } from "../../../dto/user/update-profile.dto";
import { AchievementProgressService } from "../achievement/achievement-progress.service";
import { CloudinaryService } from "../../cloudinary.service";
import {
  serializeAvatarFields,
  serializeUserAccount,
} from "../../../utils/serialize-user";
import { mediaResponseUrl } from "../../../utils/media-url";

const PROFILE_WON_TOURNAMENTS_LIMIT = 3;
const TOURNAMENT_HISTORY_LIMIT = 3;
const BEST_USER_RELATIONS = [
  "achievements",
  "achievements.achievement",
  "wonTournaments",
  "selected_achievement",
] as const;

type FriendStatusValue = "accepted" | "pending" | "blocked" | null;

function serializeAchievement(achievement: Achievement | null | undefined) {
  if (!achievement) return null;
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    color_theme: achievement.color_theme,
    icon_url: mediaResponseUrl(achievement.icon_url),
    icon_public_id: achievement.icon_public_id ?? null,
    xp_reward: achievement.xp_reward,
    type: achievement.type,
    logic_type: achievement.logic_type,
    target: achievement.target ?? null,
  };
}

export class UserService extends RepoService<User> {
  constructor() {
    super(User);
    this.incrementXp = this.incrementXp.bind(this);
    this.getBestUsers = this.getBestUsers.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.setExpoPushToken = this.setExpoPushToken.bind(this);
    this.getActiveUserIdsPage = this.getActiveUserIdsPage.bind(this);
    this.findPushTokensForUserIds = this.findPushTokensForUserIds.bind(this);
    this.setSelectedAchievement = this.setSelectedAchievement.bind(this);
  }

  async setExpoPushToken(userId: number, token: string | null) {
    await this.repo.update(userId, {
      expo_push_token: token,
      expo_push_token_updated_at: token ? new Date() : null,
    } as any);
  }

  async getActiveUserIdsPage(
    page: number,
    limit: number
  ): Promise<{ ids: number[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount({
      where: { is_active: true } as any,
      select: ["id"],
      order: { id: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { ids: rows.map((r) => r.id), total };
  }

  async findPushTokensForUserIds(
    userIds: number[]
  ): Promise<{ id: number; expo_push_token: string }[]> {
    if (userIds.length === 0) return [];
    const rows = await this.repo.find({
      where: { id: In(userIds) } as any,
      select: ["id", "expo_push_token"],
    });
    return rows
      .filter((u) => u.expo_push_token && String(u.expo_push_token).trim().length > 0)
      .map((u) => ({ id: u.id, expo_push_token: u.expo_push_token as string }));
  }

  async deductCoins(userId: number, amount: number) {
    const user = await this.repo.findOne({ where: { id: userId }, select: ["id", "coins"] });
    Ensure.exists(user, "user");
    user!.coins = Number(user!.coins || 0) - amount;
    await this.repo.save(user!);
  }

  async incrementXp(userId: number, amount: number) {
    const user = await this.repo.findOne({ where: { id: userId }, select: ["id", "xp_points"] });
    Ensure.exists(user, "user");
    const currentXp = Number(user.xp_points) || 0;
    await this.repo.update(userId, { xp_points: currentXp + amount } as any);
  }

  async setSelectedAchievement(userId: number, achievementId: number | null) {
    const payload =
      achievementId == null
        ? ({ selected_achievement: null } as any)
        : ({ selected_achievement: { id: achievementId } as Achievement } as any);
    await this.repo.update(userId, payload);
    return this.getUserProfile(userId);
  }

  async getBestUsers(query: GetBestUsersQueryDto) {
    const { data, total, page, limit } = await this.getAllWithPagination({
      page: query.page,
      limit: query.limit,
      relations: [...BEST_USER_RELATIONS],
      order: { xp_points: "DESC" },
    });

    return {
      data: data.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        gamer_name: user.gamer_name,
        ...serializeAvatarFields(user),
        xp_points: user.xp_points,
        coins: user.coins,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        achievements: user.achievements ?? [],
        wonTournaments: user.wonTournaments ?? [],
        selected_achievement: user.selected_achievement
          ? serializeAchievement(user.selected_achievement)
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  async searchUsers(currentUserId: number, query: SearchUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const raw = query.gamer_name?.trim() ?? "";
    const excludeFriends = query.exclude_friends === true;

    let excludeIds: number[] = [];
    if (excludeFriends) {
      const friendRepo = AppDataSource.getRepository(Friend);
      const rows = await friendRepo.find({
        where: [
          { user_id: currentUserId },
          { friend_user_id: currentUserId },
        ],
        select: ["user_id", "friend_user_id"],
      });
      const idSet = new Set<number>();
      for (const r of rows) {
        if (r.user_id !== currentUserId) idSet.add(r.user_id);
        if (r.friend_user_id !== currentUserId) idSet.add(r.friend_user_id);
      }
      excludeIds = Array.from(idSet);
    }

    const allExcluded = [currentUserId, ...excludeIds];

    const where: any =
      raw.length > 0
        ? { id: Not(In(allExcluded)), gamer_name: ILike(`%${raw}%`) }
        : { id: Not(In(allExcluded)) };

    const [data, total] = await this.repo.findAndCount({
      where,
      select: {
        id: true,
        full_name: true,
        gamer_name: true,
        profile_picture_url: true,
        avatar_public_id: true,
        xp_points: true,
        coins: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      order: { gamer_name: "ASC" },
      skip,
      take: limit,
    });

    const friendRepo = AppDataSource.getRepository(Friend);
    const resultIds = data.map((u: any) => u.id);
    let friendMap = new Map<number, string>();
    if (resultIds.length > 0) {
      const friendRows = await friendRepo.find({
        where: [
          { user_id: currentUserId, friend_user_id: In(resultIds) },
          { user_id: In(resultIds), friend_user_id: currentUserId },
        ],
        select: ["user_id", "friend_user_id", "status"],
      });
      for (const r of friendRows) {
        const otherId =
          r.user_id === currentUserId ? r.friend_user_id : r.user_id;
        friendMap.set(otherId, r.status);
      }
    }

    const enriched = data.map((u: any) => ({
      ...serializeUserAccount(u),
      friend_status: friendMap.get(u.id) ?? null,
    }));

    return { data: enriched, total, page, limit };
  }

  async getUserProfile(userId: number, requestingUserId?: number) {
    const user = await this.repo.findOne({
      where: { id: userId },
      relations: [
        "achievements",
        "achievements.achievement",
        "wonTournaments",
        "selected_achievement",
      ],
    });
    Ensure.exists(user, "user");

    const wonSorted = [...(user.wonTournaments ?? [])].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const won_tournaments = wonSorted.slice(0, PROFILE_WON_TOURNAMENTS_LIMIT);

    const achievementProgressService = new AchievementProgressService();
    const progressStats = await achievementProgressService.aggregateUserStats(userId);

    const achievements = (user.achievements ?? [])
      .filter((ua) => ua.displayed === true)
      .map((ua) => ({
        id: ua.id,
        obtained_at: ua.obtained_at,
        displayed: ua.displayed,
        achievement: ua.achievement
          ? {
              ...serializeAchievement(ua.achievement as Achievement),
              ...achievementProgressService.getProgress(ua.achievement as any, progressStats, true),
            }
          : null,
      }));

    const regRepo = AppDataSource.getRepository(PubgRegistration);
    const registrations = await regRepo.find({
      where: { user: { id: userId } } as any,
      relations: ["tournament", "tournament.winners"],
      order: { registered_at: "DESC" } as any,
      take: TOURNAMENT_HISTORY_LIMIT,
    });

    const wonIds = new Set((user.wonTournaments ?? []).map((t: Tournament) => t.id));
    const tournament_history = registrations.map((reg) => {
      const t = reg.tournament;
      const entryFee = Number(t.entry_fee) || 0;
      const prizePool = Number(t.prize_pool) || 0;
      const isWinner = wonIds.has(t.id);
      const isFree = entryFee === 0;

      let result: "won" | "lost" | "free" = "lost";
      let amount = 0;
      if (isFree) {
        result = "free";
        amount = 0;
      } else if (isWinner) {
        result = "won";
        const winnersCount = (t.winners ?? []).length || 1;
        amount = prizePool / winnersCount;
      } else if (!t.is_active) {
        result = "lost";
        amount = entryFee;
      } else {
        result = "lost";
        amount = 0;
      }

      return {
        tournament_id: t.id,
        title: t.title,
        entry_fee: entryFee,
        prize_pool: prizePool,
        xp_reward: Number(t.prize_pool) > 0 ? Math.round(prizePool * 0.1) : 0,
        is_active: t.is_active,
        result,
        amount,
        registered_at: reg.registered_at,
      };
    });

    let friend_status: FriendStatusValue = null;
    const viewerId =
      requestingUserId != null ? Number(requestingUserId) : NaN;
    if (
      Number.isFinite(viewerId) &&
      viewerId > 0 &&
      viewerId !== userId
    ) {
      const friendRepo = AppDataSource.getRepository(Friend);
      // Composite PK: avoid `select: ["status"]` only — TypeORM needs PK columns;
      // mirror FriendService with two directional lookups.
      const friendRow =
        (await friendRepo.findOne({
          where: { user_id: viewerId, friend_user_id: userId },
        })) ??
        (await friendRepo.findOne({
          where: { user_id: userId, friend_user_id: viewerId },
        }));
      if (friendRow?.status != null) {
        friend_status = friendRow.status as FriendStatusValue;
      }
    }

    const titles_count = user.achievements?.length ?? 0;
    const tournaments_participated_count = progressStats.tournament_join;

    const publicUser = {
      id: user.id,
      full_name: user.full_name,
      gamer_name: user.gamer_name,
      ...serializeAvatarFields(user),
      xp_points: user.xp_points,
      coins: user.coins,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      selected_achievement: user.selected_achievement
        ? {
            ...serializeAchievement(user.selected_achievement),
            ...achievementProgressService.getProgress(user.selected_achievement, progressStats, true),
          }
        : null,
      friend_status,
    };

    return {
      user: publicUser,
      stats: {
        titles_count,
        tournaments_participated_count,
      },
      achievements,
      won_tournaments,
      tournament_history,
    };
  }

  async updateProfile(
    userId: number,
    dto: ProfileUpdateDto
  ) {
    Ensure.isNumber(userId, "user");

    const payload: Partial<
      Pick<
        User,
        | "full_name"
        | "gamer_name"
        | "email"
        | "phone"
        | "profile_picture_url"
        | "avatar_public_id"
      >
    > = {};

    if (dto.full_name !== undefined) payload.full_name = dto.full_name;
    if (dto.gamer_name !== undefined) payload.gamer_name = dto.gamer_name;
    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.phone !== undefined) payload.phone = dto.phone;
    if (dto.avatarUrl !== undefined) {
      payload.profile_picture_url = dto.avatarUrl ?? null;
      payload.avatar_public_id = dto.avatarPublicId ?? null;
    }

    Ensure.custom(
      Object.keys(payload).length > 0,
      ErrorMessages.generateErrorMessage("profile", "missing fields", getLanguage())
    );

    if (payload.email !== undefined) {
      const taken = await this.repo.findOne({
        where: { email: payload.email },
        select: ["id"],
      });
      Ensure.alreadyExists(!!(taken && taken.id !== userId), "email");
    }

    if (payload.phone !== undefined) {
      const taken = await this.repo.findOne({
        where: { phone: payload.phone },
        select: ["id"],
      });
      Ensure.alreadyExists(!!(taken && taken.id !== userId), "phone");
    }

    const currentUser =
      dto.avatarUrl !== undefined
        ? await this.repo.findOne({
            where: { id: userId },
            select: ["id", "avatar_public_id"],
          })
        : null;
    Ensure.exists(currentUser || dto.avatarUrl === undefined, "user");

    const currentAvatarPublicId = currentUser?.avatar_public_id?.trim() || null;
    const nextAvatarPublicId = payload.avatar_public_id?.trim() || null;
    if (
      currentAvatarPublicId &&
      currentAvatarPublicId !== nextAvatarPublicId
    ) {
      const cloudinaryService = new CloudinaryService();
      await cloudinaryService.destroyImage(currentAvatarPublicId);
    }

    await this.repo.update(userId, payload as any);
    return this.getUserProfile(userId);
  }
}
