import { Ensure } from "../../../common/errors/Ensure.handler";
import { UserAchievement } from "../../../entities/UserAchievement";
import { RepoService } from "../../repo.service";

const MAX_DISPLAYED = 4;

export class UserAchievementService extends RepoService<UserAchievement> {
  constructor() {
    super(UserAchievement);
    this.findByUserAndAchievement = this.findByUserAndAchievement.bind(this);
    this.toggleDisplayed = this.toggleDisplayed.bind(this);
    this.getMyAchievements = this.getMyAchievements.bind(this);
  }

  async findByUserAndAchievement(userId: number, achievementId: number) {
    return await this.findOneByCondition({
      user: { id: userId },
      achievement: { id: achievementId },
    } as any);
  }

  async getMyAchievements(userId: number) {
    return await this.repo.find({
      where: { user: { id: userId } } as any,
      relations: ["achievement"],
      order: { obtained_at: "DESC" } as any,
    });
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
}
