import { Ensure } from "../../../common/errors/Ensure.handler";
import { ReelComment } from "../../../entities/ReelComment";
import { RepoService } from "../../repo.service";
import { ReelService } from "../reel/reel.service";
import { GetCommentsQueryDto } from "../../../dto/reel/get-comments-query.dto";
import { TagService } from "../achievement/tag.service";
import { serializeUserAccount } from "../../../utils/serialize-user";

export class ReelCommentService extends RepoService<ReelComment> {
  constructor() {
    super(ReelComment);
    this.addComment = this.addComment.bind(this);
    this.getCommentsByReelId = this.getCommentsByReelId.bind(this);
  }

  async addComment(reelId: number, userId: number, comment: string, mentionedUserIds?: number[]) {
    const reelService = new ReelService();
    const reel = await reelService.findOneByCondition({ id: reelId } as any);
    Ensure.exists(reel, "reel");

    const created = await this.create({
      reel: { id: reelId } as any,
      user: { id: userId } as any,
      comment,
    } as any);

    const tagService = new TagService();
    await tagService.syncCommentTags({
      reelId,
      commentId: created.id,
      creatorId: userId,
      commentText: comment,
      mentionedUserIds: mentionedUserIds ?? [],
    });

    return created;
  }

  async getCommentsByReelId(reelId: number, query: GetCommentsQueryDto) {
    const reelService = new ReelService();
    const reel = await reelService.findOneByCondition({ id: reelId } as any);
    Ensure.exists(reel, "reel");

    const { page = 1, limit = 10 } = query;
    const result = await this.getAllWithPagination({
      where: { reel: { id: reelId } } as any,
      relations: ["user"] as any,
      order: { created_at: "DESC" } as any,
      page,
      limit,
    });
    return {
      ...result,
      data: result.data.map((comment: any) => ({
        ...comment,
        user: comment.user ? serializeUserAccount(comment.user as any) : comment.user,
      })),
    };
  }
}
