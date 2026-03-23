import { Ensure } from "../../../common/errors/Ensure.handler";
import { User } from "../../../entities/User";
import { RepoService } from "../../repo.service";
import { GetBestUsersQueryDto } from "../../../dto/user/get-best-users-query.dto";

const LATEST_WON_TOURNAMENTS_LIMIT = 10;

export class UserService extends RepoService<User> {
  constructor() {
    super(User);
    this.incrementXp = this.incrementXp.bind(this);
    this.getBestUsers = this.getBestUsers.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
  }

  async incrementXp(userId: number, amount: number) {
    const user = await this.repo.findOne({ where: { id: userId }, select: ["id", "xp_points"] });
    Ensure.exists(user, "user");
    const currentXp = Number(user.xp_points) || 0;
    await this.repo.update(userId, { xp_points: currentXp + amount } as any);
  }

  async getBestUsers(query: GetBestUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
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
      order: { xp_points: "DESC" },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getUserProfile(userId: number) {
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

    const achievements = (user.achievements ?? []).map((ua) => ({
      obtained_at: ua.obtained_at,
      achievement: ua.achievement
        ? {
            id: ua.achievement.id,
            name: ua.achievement.name,
            description: ua.achievement.description,
            color_theme: ua.achievement.color_theme,
            icon_url: ua.achievement.icon_url,
            xp_reward: ua.achievement.xp_reward,
          }
        : null,
    }));

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
    };
  }
}
