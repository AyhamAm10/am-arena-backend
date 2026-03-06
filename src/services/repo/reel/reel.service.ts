import { Ensure } from "../../../common/errors/Ensure.handler";
import { Reel } from "../../../entities/Reel";
import { RepoService } from "../../repo.service";
import { GetReelsQueryDto } from "../../../dto/reel/get-reels-query.dto";

export class ReelService extends RepoService<Reel> {
  constructor() {
    super(Reel);
    this.createReel = this.createReel.bind(this);
    this.getReels = this.getReels.bind(this);
  }

  async createReel(params: { title: string; video_url: string; description: string; userId: number }) {
    return await this.create({
      title: params.title,
      video_url: params.video_url,
      description: params.description,
      user: { id: params.userId } as any,
    } as any);
  }

  async getReels(query: GetReelsQueryDto) {
    const { page = 1, limit = 10 } = query;
    return await this.getAllWithPagination({ page, limit, order: { created_at: "DESC" } as any });
  }
}
