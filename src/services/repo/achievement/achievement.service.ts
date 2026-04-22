import { Ensure } from "../../../common/errors/Ensure.handler";
import { Achievement } from "../../../entities/Achievement";
import { RepoService } from "../../repo.service";
import { CreateAchievementDto } from "../../../dto/achievement/create-achievement.dto";
import { UpdateAchievementDto } from "../../../dto/achievement/update-achievement.dto";
import { GetAchievementsQueryDto } from "../../../dto/achievement/get-achievements-query.dto";
import { UserAchievementService } from "../user-achievement/user-achievement.service";
import { UserService } from "../user/user.service";
import { NotificationService } from "../notification/notification.service";
import { AchievementProgressService } from "./achievement-progress.service";
import { mediaResponseUrl } from "../../../utils/media-url";

type CreateAchievementParams = CreateAchievementDto & {
  icon_url?: string;
  icon_public_id?: string | null;
};

export class AchievementService extends RepoService<Achievement> {
  constructor() {
    super(Achievement);
    this.createAchievement = this.createAchievement.bind(this);
    this.updateAchievement = this.updateAchievement.bind(this);
    this.deleteAchievement = this.deleteAchievement.bind(this);
    this.getAchievements = this.getAchievements.bind(this);
    this.assignToUser = this.assignToUser.bind(this);
  }

  async createAchievement(params: CreateAchievementParams) {
    Ensure.required(params.name, "name");
    Ensure.required(params.description, "description");
    Ensure.required(params.icon_url, "icon_url");
    Ensure.custom(
      params.logic_type !== "progress" || (params.target != null && Number(params.target) > 0),
      "Progress achievements require a target",
    );
    const created = await this.create({
      name: params.name,
      description: params.description,
      color_theme: params.color_theme ?? null,
      icon_url: params.icon_url,
      icon_public_id: params.icon_public_id ?? null,
      xp_reward: params.xp_reward ?? 0,
      type: params.type,
      logic_type: params.logic_type,
      target: params.target ?? null,
    } as any);
    return {
      ...created,
      icon_url: mediaResponseUrl((created as Achievement).icon_url),
    };
  }

  async updateAchievement(
    id: string | number,
    params: UpdateAchievementDto & { icon_public_id?: string | null }
  ) {
    const current = (await this.getById(id)) as Achievement;
    const data: any = {};
    if (params.name !== undefined) data.name = params.name;
    if (params.description !== undefined) data.description = params.description;
    if (params.color_theme !== undefined) data.color_theme = params.color_theme;
    if (params.icon_url !== undefined) data.icon_url = params.icon_url;
    if (params.icon_public_id !== undefined) data.icon_public_id = params.icon_public_id;
    if (params.xp_reward !== undefined) data.xp_reward = params.xp_reward;
    if (params.type !== undefined) data.type = params.type;
    if (params.logic_type !== undefined) data.logic_type = params.logic_type;
    if (params.target !== undefined) data.target = params.target ?? null;
    const nextLogicType = params.logic_type ?? current.logic_type;
    if (nextLogicType === "progress") {
      const target = params.target !== undefined ? params.target : current.target ?? null;
      Ensure.custom(target != null && Number(target) > 0, "Progress achievements require a target");
    }
    if (Object.keys(data).length === 0) {
      const row = (await this.getById(id)) as Achievement;
      return { ...row, icon_url: mediaResponseUrl(row.icon_url) };
    }
    const updated = await this.update(id, data);
    return {
      ...(updated as Achievement),
      icon_url: mediaResponseUrl((updated as Achievement).icon_url),
    };
  }

  async deleteAchievement(id: string | number) {
    await this.delete(id);
  }

  async getAchievements(query: GetAchievementsQueryDto) {
    const viewerUserId = query.user_id ? Number(query.user_id) : null;
    const { name, page = 1, limit = 10 } = query;
    if (name?.trim()) {
      const qb = this.repo.createQueryBuilder("a").where("a.name ILIKE :name", { name: `%${name.trim()}%` });
      const [data, total] = await qb
        .orderBy("a.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return {
        data: await this.decorateAchievementsForUser(data, viewerUserId),
        total,
        page,
        limit,
      };
    }
    const result = await this.getAllWithPagination({ page, limit, order: { created_at: "DESC" } as any });
    return {
      ...result,
      data: await this.decorateAchievementsForUser(result.data, viewerUserId),
    };
  }

  async assignToUser(achievementId: string | number, userId: number) {
    const achievement = await this.getById(achievementId) as Achievement;
    const userService = new UserService();
    const user = await userService.findOneByCondition({ id: userId } as any);
    Ensure.exists(user, "user");

    const userAchievementService = new UserAchievementService();
    const existing = await userAchievementService.findByUserAndAchievement(userId, achievement.id);
    Ensure.custom(!existing, "User already has this achievement");

    const ua = await userAchievementService.create({
      user: { id: userId } as any,
      achievement: { id: achievement.id } as any,
      obtained_at: new Date(),
    } as any);

    await userService.incrementXp(userId, achievement.xp_reward);

    const notificationService = new NotificationService();
    await notificationService.notifyAchievementUnlocked({
      userId,
      userAchievementId: (ua as any).id,
      achievement,
    });

    return ua;
  }

  private async decorateAchievementsForUser(
    achievements: Achievement[],
    userId: number | null,
  ) {
    if (userId == null || achievements.length === 0) {
      return achievements.map((achievement) => ({
        ...achievement,
        icon_url: mediaResponseUrl(achievement.icon_url),
        current: 0,
        target: achievement.target ?? null,
        percentage: 0,
        is_obtained: false,
        displayed: false,
      }));
    }

    const userAchievementService = new UserAchievementService();
    const progressService = new AchievementProgressService();
    const [userAchievements, stats] = await Promise.all([
      userAchievementService.getMyAchievements(userId),
      progressService.aggregateUserStats(userId),
    ]);
    const byAchievementId = new Map(
      userAchievements
        .filter((item) => item.achievement)
        .map((item) => [item.achievement.id, item]),
    );

    return achievements.map((achievement) => {
      const row = byAchievementId.get(achievement.id);
      const progress = progressService.getProgress(achievement, stats, Boolean(row));
      return {
        ...achievement,
        icon_url: mediaResponseUrl(achievement.icon_url),
        ...progress,
        displayed: row?.displayed ?? false,
      };
    });
  }
}
