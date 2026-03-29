import { Ensure } from "../../../common/errors/Ensure.handler";
import { UserAchievement } from "../../../entities/UserAchievement";
import { RepoService } from "../../repo.service";

export class UserAchievementService extends RepoService<UserAchievement> {
  constructor() {
    super(UserAchievement);
    this.findByUserAndAchievement = this.findByUserAndAchievement.bind(this);
    this.toggleDisplayed = this.toggleDisplayed.bind(this);
  }

  async findByUserAndAchievement(userId: number, achievementId: number) {
    return await this.findOneByCondition({
      user: { id: userId },
      achievement: { id: achievementId },
    } as any);
  }

  async toggleDisplayed(userAchievementId: number, userId: number) {
    const ua = await this.repo.findOne({
      where: { id: userAchievementId } as any,
      relations: ["user"],
    });
    Ensure.exists(ua, "user_achievement");
    Ensure.forbidden(ua.user.id !== userId, "user_achievement");
    ua.displayed = !ua.displayed;
    return await this.repo.save(ua);
  }
}
