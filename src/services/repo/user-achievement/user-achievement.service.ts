import { Ensure } from "../../../common/errors/Ensure.handler";
import { UserAchievement } from "../../../entities/UserAchievement";
import { RepoService } from "../../repo.service";

export class UserAchievementService extends RepoService<UserAchievement> {
  constructor() {
    super(UserAchievement);
    this.findByUserAndAchievement = this.findByUserAndAchievement.bind(this);
  }

  async findByUserAndAchievement(userId: number, achievementId: number) {
    return await this.findOneByCondition({
      user: { id: userId },
      achievement: { id: achievementId },
    } as any);
  }
}
