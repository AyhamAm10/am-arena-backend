import { Ensure } from "../../../common/errors/Ensure.handler";
import { ReelLike } from "../../../entities/ReelLike";
import { RepoService } from "../../repo.service";
import { ReelService } from "../reel/reel.service";

export class ReelLikeService extends RepoService<ReelLike> {
  constructor() {
    super(ReelLike);
    this.likeReel = this.likeReel.bind(this);
    this.removeLike = this.removeLike.bind(this);
  }

  async likeReel(reelId: number, userId: number) {
    const reelService = new ReelService();
    const reel = await reelService.findOneByCondition({ id: reelId } as any);
    Ensure.exists(reel, "reel");

    const existing = await this.findOneByCondition({
      reel: { id: reelId },
      user: { id: userId },
    } as any);
    Ensure.custom(!existing, "Already liked this reel");

    return await this.create({
      reel: { id: reelId } as any,
      user: { id: userId } as any,
    } as any);
  }

  async removeLike(reelId: number, userId: number) {
    const like = await this.findOneByCondition({
      reel: { id: reelId },
      user: { id: userId },
    } as any);
    Ensure.exists(like, "like");

    await this.repo.delete({ id: (like as any).id });
  }
}
