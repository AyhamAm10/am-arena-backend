import { Ensure } from "../../../common/errors/Ensure.handler";
import { Achievement } from "../../../entities/Achievement";
import { RepoService } from "../../repo.service";
import { CreateAchievementDto } from "../../../dto/achievement/create-achievement.dto";
import { UpdateAchievementDto } from "../../../dto/achievement/update-achievement.dto";
import { GetAchievementsQueryDto } from "../../../dto/achievement/get-achievements-query.dto";
import { UserAchievementService } from "../user-achievement/user-achievement.service";
import { UserService } from "../user/user.service";

type CreateAchievementParams = CreateAchievementDto & { icon_url?: string };

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
    return await this.create({
      name: params.name,
      description: params.description,
      color_theme: params.color_theme ?? null,
      icon_url: params.icon_url,
      xp_reward: params.xp_reward ?? 0,
    } as any);
  }

  async updateAchievement(id: string | number, params: UpdateAchievementDto) {
    await this.getById(id);
    const data: any = {};
    if (params.name !== undefined) data.name = params.name;
    if (params.description !== undefined) data.description = params.description;
    if (params.color_theme !== undefined) data.color_theme = params.color_theme;
    if (params.icon_url !== undefined) data.icon_url = params.icon_url;
    if (params.xp_reward !== undefined) data.xp_reward = params.xp_reward;
    if (Object.keys(data).length === 0) return await this.getById(id);
    return await this.update(id, data);
  }

  async deleteAchievement(id: string | number) {
    await this.delete(id);
  }

  async getAchievements(query: GetAchievementsQueryDto) {
    const { name, page = 1, limit = 10 } = query;
    if (name?.trim()) {
      const qb = this.repo.createQueryBuilder("a").where("a.name ILIKE :name", { name: `%${name.trim()}%` });
      const [data, total] = await qb
        .orderBy("a.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return { data, total, page, limit };
    }
    return await this.getAllWithPagination({ page, limit });
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

    return ua;
  }
}
