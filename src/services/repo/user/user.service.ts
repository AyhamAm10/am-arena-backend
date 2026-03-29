import { Ensure } from "../../../common/errors/Ensure.handler";
import { ErrorMessages } from "../../../common/errors/ErrorMessages";
import { getLanguage } from "../../../middlewares/lang.middleware";
import { ILike, In, Not } from "typeorm";
import { AppDataSource } from "../../../config/data_source";
import { Friend, FriendStatus } from "../../../entities/Friend";
import { PubgRegistration } from "../../../entities/PubgRegistration";
import { Tournament } from "../../../entities/Tournament";
import { User } from "../../../entities/User";
import { RepoService } from "../../repo.service";
import { GetBestUsersQueryDto } from "../../../dto/user/get-best-users-query.dto";
import { SearchUsersQueryDto } from "../../../dto/user/search-users-query.dto";
import { ProfileUpdateDto } from "../../../dto/user/update-profile.dto";

const LATEST_WON_TOURNAMENTS_LIMIT = 10;
const TOURNAMENT_HISTORY_LIMIT = 20;
const BEST_USER_RELATIONS = ["achievements", "achievements.achievement", "wonTournaments"] as const;

export class UserService extends RepoService<User> {
  constructor() {
    super(User);
    this.incrementXp = this.incrementXp.bind(this);
    this.getBestUsers = this.getBestUsers.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
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
        profile_picture_url: user.profile_picture_url,
        xp_points: user.xp_points,
        coins: user.coins,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        achievements: user.achievements ?? [],
        wonTournaments: user.wonTournaments ?? [],
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
      ...u,
      friend_status: friendMap.get(u.id) ?? null,
    }));

    return { data: enriched, total, page, limit };
  }

  async getUserProfile(userId: number, requestingUserId?: number) {
    const user = await this.repo.findOne({
      where: { id: userId },
      relations: ["achievements", "achievements.achievement", "wonTournaments"],
    });
    Ensure.exists(user, "user");

    const wonSorted = [...(user.wonTournaments ?? [])].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const won_tournaments = wonSorted.slice(0, LATEST_WON_TOURNAMENTS_LIMIT);

    const isOwnProfile = requestingUserId != null && requestingUserId === userId;
    const rawAchievements = user.achievements ?? [];
    const filteredAchievements = isOwnProfile
      ? rawAchievements
      : rawAchievements.filter((ua) => ua.displayed !== false);

    const achievements = filteredAchievements.map((ua) => ({
      id: ua.id,
      obtained_at: ua.obtained_at,
      displayed: ua.displayed,
      achievement: ua.achievement ?? null,
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

    const publicUser = {
      id: user.id,
      full_name: user.full_name,
      gamer_name: user.gamer_name,
      profile_picture_url: user.profile_picture_url,
      xp_points: user.xp_points,
      coins: user.coins,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return {
      user: publicUser,
      achievements,
      won_tournaments,
      tournament_history,
    };
  }

  async updateProfile(
    userId: number,
    dto: ProfileUpdateDto,
    profilePictureUrl?: string
  ) {
    Ensure.isNumber(userId, "user");

    const payload: Partial<
      Pick<
        User,
        "full_name" | "gamer_name" | "email" | "phone" | "profile_picture_url"
      >
    > = {};

    if (dto.full_name !== undefined) payload.full_name = dto.full_name;
    if (dto.gamer_name !== undefined) payload.gamer_name = dto.gamer_name;
    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.phone !== undefined) payload.phone = dto.phone;
    if (profilePictureUrl !== undefined) {
      payload.profile_picture_url = profilePictureUrl;
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

    await this.repo.update(userId, payload as any);
    return this.getUserProfile(userId);
  }
}
