import { Ensure } from "../../../common/errors/Ensure.handler";
import { AppDataSource } from "../../../config/data_source";
import { Reel } from "../../../entities/Reel";
import { ReelComment } from "../../../entities/ReelComment";
import { ReelLike } from "../../../entities/ReelLike";
import { RepoService } from "../../repo.service";
import { GetReelsQueryDto } from "../../../dto/reel/get-reels-query.dto";
import { HighlightService } from "../achievement/highlight.service";
import { serializeUserAccount } from "../../../utils/serialize-user";
import { mediaResponseUrl } from "../../../utils/media-url";

export type ReelFeedItem = {
  id: number;
  title: string;
  video_url: string;
  video_public_id?: string | null;
  description: string;
  created_at: Date;
  updated_at: Date;
  user: unknown;
  comments: unknown[];
  likes_count: number;
  comments_count: number;
  liked_by_current_user: boolean;
};

export class ReelService extends RepoService<Reel> {
  constructor() {
    super(Reel);
    this.createReel = this.createReel.bind(this);
    this.getReels = this.getReels.bind(this);
    this.getReelsForFeed = this.getReelsForFeed.bind(this);
    this.updateReelByOwner = this.updateReelByOwner.bind(this);
    this.deleteReelByOwner = this.deleteReelByOwner.bind(this);
  }

  async createReel(params: {
    title: string;
    video_url: string;
    video_public_id?: string | null;
    description: string;
    userId: number;
    mentioned_user_ids?: number[];
  }) {
    const reel = await this.create({
      title: params.title,
      video_url: params.video_url,
      video_public_id: params.video_public_id ?? null,
      description: params.description,
      user: { id: params.userId } as any,
    } as any);
    await new HighlightService().syncReelHighlights({
      reelId: reel.id,
      mentionedUserIds: params.mentioned_user_ids ?? [],
      actorUserId: params.userId,
    });
    return {
      ...reel,
      video_url: mediaResponseUrl((reel as Reel).video_url),
    };
  }

  async getReels(query: GetReelsQueryDto) {
    const { page = 1, limit = 10 } = query;
    const result = await this.getAllWithPagination({
      page,
      limit,
      order: { created_at: "DESC" } as any,
    });
    return {
      ...result,
      data: (result.data as Reel[]).map((r) => ({
        ...r,
        video_url: mediaResponseUrl(r.video_url),
      })),
    };
  }

  async getReelsForFeed(
    query: GetReelsQueryDto,
    viewerUserId?: number
  ): Promise<{ data: ReelFeedItem[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const total = await this.repo.createQueryBuilder("reel").getCount();

    const reels = await this.repo
      .createQueryBuilder("reel")
      .leftJoinAndSelect("reel.user", "user")
      .leftJoinAndSelect("reel.comments", "comment")
      .leftJoinAndSelect("comment.user", "commentUser")
      .loadRelationCountAndMap("reel.likesCount", "reel.likes")
      .orderBy("reel.created_at", "DESC")
      .addOrderBy("comment.created_at", "ASC")
      .skip(skip)
      .take(limit)
      .getMany();

    const reelIds = reels.map((r) => r.id);
    let likedIds = new Set<number>();
    if (viewerUserId != null && reelIds.length > 0) {
      const likes = await AppDataSource.getRepository(ReelLike)
        .createQueryBuilder("like")
        .innerJoinAndSelect("like.reel", "reel")
        .innerJoin("like.user", "user")
        .where("user.id = :uid", { uid: viewerUserId })
        .andWhere("reel.id IN (:...ids)", { ids: reelIds })
        .getMany();
      likedIds = new Set(likes.map((l) => l.reel.id));
    }

    const data: ReelFeedItem[] = reels.map((r: Reel & { likesCount?: number }) => {
      const comments = r.comments ?? [];
      return {
        id: r.id,
        title: r.title,
        video_url: mediaResponseUrl(r.video_url),
        video_public_id: r.video_public_id ?? null,
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at,
        user: r.user ? serializeUserAccount(r.user as any) : r.user,
        comments: comments.map((comment: any) => ({
          ...comment,
          user: comment.user ? serializeUserAccount(comment.user as any) : comment.user,
        })),
        likes_count: r.likesCount ?? 0,
        comments_count: comments.length,
        liked_by_current_user: likedIds.has(r.id),
      };
    });

    return { data, total, page, limit };
  }

  private async assertReelOwnedByUser(reelId: number, userId: number): Promise<Reel> {
    const reel = await this.repo.findOne({
      where: { id: reelId } as any,
      relations: ["user"],
    });
    Ensure.exists(reel, "reel");
    const ownerId = (reel as Reel & { user?: { id: number } }).user?.id;
    Ensure.forbidden(ownerId === userId, "reel");
    return reel;
  }

  async updateReelByOwner(
    reelId: number,
    userId: number,
    params: {
      title?: string;
      description?: string;
      video_url?: string;
      video_public_id?: string | null;
      mentioned_user_ids?: number[];
    }
  ) {
    await this.assertReelOwnedByUser(reelId, userId);
    const patch: Record<string, unknown> = {};
    if (params.title !== undefined) patch.title = params.title;
    if (params.description !== undefined) patch.description = params.description;
    if (params.video_url !== undefined) patch.video_url = params.video_url;
    if (params.video_public_id !== undefined) patch.video_public_id = params.video_public_id;
    const updated = await this.update(reelId, patch as any);
    if (params.mentioned_user_ids !== undefined) {
      await new HighlightService().syncReelHighlights({
        reelId,
        mentionedUserIds: params.mentioned_user_ids,
        actorUserId: userId,
      });
    }
    return {
      ...(updated as Reel),
      video_url: mediaResponseUrl((updated as Reel).video_url),
    };
  }

  async deleteReelByOwner(reelId: number, userId: number) {
    await this.assertReelOwnedByUser(reelId, userId);
    await AppDataSource.getRepository(ReelLike).delete({ reel: { id: reelId } } as any);
    await AppDataSource.getRepository(ReelComment).delete({ reel: { id: reelId } } as any);
    await this.delete(reelId);
  }
}
