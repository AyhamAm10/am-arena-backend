import { Ensure } from "../../../common/errors/Ensure.handler";
import { UserAchievement } from "../../../entities/UserAchievement";
import { RepoService } from "../../repo.service";
import { AchievementProgressService } from "../achievement/achievement-progress.service";
import { UserService } from "../user/user.service";

const MAX_DISPLAYED = 4;

export class UserAchievementService extends RepoService<UserAchievement> {
  constructor() {
    super(UserAchievement);
    this.findByUserAndAchievement = this.findByUserAndAchievement.bind(this);
    this.toggleDisplayed = this.toggleDisplayed.bind(this);
    this.getMyAchievements = this.getMyAchievements.bind(this);
    this.setActiveAchievement = this.setActiveAchievement.bind(this);
  }

  async findByUserAndAchievement(userId: number, achievementId: number) {
    return await this.findOneByCondition({
      user: { id: userId },
      achievement: { id: achievementId },
    } as any);
  }

  async getMyAchievements(userId: number) {
    const rows = await this.repo.find({
      where: { user: { id: userId } } as any,
      relations: ["achievement"],
      order: { obtained_at: "DESC" } as any,
    });
    const progressService = new AchievementProgressService();
    const stats = await progressService.aggregateUserStats(userId);
    return rows.map((ua) => ({
      ...ua,
      achievement: ua.achievement
        ? {
            ...ua.achievement,
            ...progressService.getProgress(ua.achievement as any, stats, true),
          }
        : null,
    }));
  }

  async toggleDisplayed(userAchievementId: number, userId: number) {
    const ua = await this.repo.findOne({
      where: { id: userAchievementId } as any,
      relations: ["user"],
    });
    Ensure.exists(ua, "user_achievement");
    Ensure.forbidden(Number(ua.user.id) === Number(userId), "user_achievement");

    if (!ua.displayed) {
      const displayedCount = await this.repo.count({
        where: { user: { id: userId }, displayed: true } as any,
      });
      Ensure.custom(
        displayedCount < MAX_DISPLAYED,
        `You can display a maximum of ${MAX_DISPLAYED} achievements.`
      );
    }

    ua.displayed = !ua.displayed;
    return await this.repo.save(ua);
  }

  async setActiveAchievement(userAchievementId: number, userId: number) {
    const ua = await this.repo.findOne({
      where: { id: userAchievementId } as any,
      relations: ["user", "achievement"],
    });
    Ensure.exists(ua, "user_achievement");
    Ensure.forbidden(Number(ua.user.id) === Number(userId), "user_achievement");
    Ensure.exists(ua.achievement, "achievement");

    const userService = new UserService();
    await userService.setSelectedAchievement(userId, ua.achievement.id);

    return {
      user_achievement_id: ua.id,
      selected_achievement_id: ua.achievement.id,
    };
  }
}
