import { In } from "typeorm";
import { AppDataSource } from "../../../config/data_source";
import { Ensure } from "../../../common/errors/Ensure.handler";
import { Reel } from "../../../entities/Reel";
import { ReelComment } from "../../../entities/ReelComment";
import { Tag } from "../../../entities/Tag";
import { User } from "../../../entities/User";
import { NotificationService } from "../notification/notification.service";
import { serializeUserRef } from "../../../utils/serialize-user";

function normalizeIds(ids: readonly number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const raw of ids) {
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function extractMentionHandles(text: string): string[] {
  const source = (text || "").trim();
  if (!source) return [];
  const matches = source.match(/@([A-Za-z0-9_\.]{2,32})/g) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of matches) {
    const value = token.slice(1).trim().toLowerCase();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

export class TagService {
  async searchUsersForMention(currentUserId: number, query: string, limit = 10) {
    const term = query.trim();
    Ensure.custom(term.length > 0, "query is required");

    const userRepo = AppDataSource.getRepository(User);
    const rows = await userRepo
      .createQueryBuilder("user")
      .where("user.id != :currentUserId", { currentUserId })
      .andWhere("LOWER(user.gamer_name) LIKE :term", { term: `%${term.toLowerCase()}%` })
      .orderBy("user.gamer_name", "ASC")
      .take(Math.min(20, Math.max(1, limit)))
      .getMany();

    return rows.map((user) => serializeUserRef(user));
  }

  async syncCommentTags(params: {
    reelId: number;
    commentId: number;
    creatorId: number;
    commentText: string;
    mentionedUserIds?: number[];
  }) {
    const reelRepo = AppDataSource.getRepository(Reel);
    const commentRepo = AppDataSource.getRepository(ReelComment);
    const tagRepo = AppDataSource.getRepository(Tag);
    const userRepo = AppDataSource.getRepository(User);

    const [reel, comment] = await Promise.all([
      reelRepo.findOneBy({ id: params.reelId }),
      commentRepo.findOneBy({ id: params.commentId }),
    ]);
    Ensure.exists(reel, "reel");
    Ensure.exists(comment, "comment");

    const explicitIds = normalizeIds(params.mentionedUserIds ?? []);
    const handles = extractMentionHandles(params.commentText);

    const usersFromHandles =
      handles.length === 0
        ? []
        : await userRepo
            .createQueryBuilder("user")
            .where("LOWER(user.gamer_name) IN (:...handles)", { handles })
            .getMany();

    const fromHandles = usersFromHandles.map((u) => Number(u.id));
    const mergedIds = normalizeIds([...explicitIds, ...fromHandles]).filter(
      (id) => id !== params.creatorId,
    );
    if (mergedIds.length === 0) return [];

    const existing = await tagRepo.find({
      where: { comment: { id: params.commentId } } as any,
      relations: ["user"],
    });
    const existingByUserId = new Map(existing.map((row) => [Number(row.user.id), row]));
    const nextSet = new Set(mergedIds);

    const toDelete = existing.filter((row) => !nextSet.has(Number(row.user.id)));
    if (toDelete.length > 0) {
      await tagRepo.remove(toDelete);
    }

    const existingUserIds = new Set(existing.map((row) => Number(row.user.id)));
    const createIds = mergedIds.filter((id) => !existingUserIds.has(id));
    if (createIds.length === 0) return mergedIds;

    const foundUsers = await userRepo.find({ where: { id: In(createIds) } as any });
    const foundIds = new Set(foundUsers.map((user) => Number(user.id)));
    const validCreateIds = createIds.filter((id) => foundIds.has(id));
    if (validCreateIds.length === 0) return mergedIds;

    await tagRepo.save(
      validCreateIds.map((userId) =>
        tagRepo.create({
          user: { id: userId } as User,
          creator: { id: params.creatorId } as User,
          reel: { id: params.reelId } as Reel,
          comment: { id: params.commentId } as ReelComment,
        }),
      ),
    );

    const notificationService = new NotificationService();
    await Promise.all(
      validCreateIds.map((receiverUserId) =>
        notificationService.notifyReelHighlight({
          receiverUserId,
          reelId: params.reelId,
          mentionedByUserId: params.creatorId,
          commentId: params.commentId,
        }),
      ),
    );

    return mergedIds;
  }
}
