import { Ensure } from "../../../common/errors/Ensure.handler";
import { User } from "../../../entities/User";
import { RepoService } from "../../repo.service";

export class UserService extends RepoService<User> {
  constructor() {
    super(User);
    this.incrementXp = this.incrementXp.bind(this);
  }

  async incrementXp(userId: number, amount: number) {
    const user = await this.repo.findOne({ where: { id: userId }, select: ["id", "xp_points"] });
    Ensure.exists(user, "user");
    const currentXp = Number(user.xp_points) || 0;
    await this.repo.update(userId, { xp_points: currentXp + amount } as any);
  }
}
