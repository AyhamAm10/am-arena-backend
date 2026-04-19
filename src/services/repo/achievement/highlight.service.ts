import { AppDataSource } from "../../../config/data_source";
import { Highlight } from "../../../entities/Highlight";
import { Reel } from "../../../entities/Reel";
import { User } from "../../../entities/User";
import { Ensure } from "../../../common/errors/Ensure.handler";
import { NotificationService } from "../notification/notification.service";

function normalizeMentionIds(ids: readonly number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const raw of ids) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export class HighlightService {
  async syncReelHighlights(params: {
    reelId: number;
    mentionedUserIds: number[];
    actorUserId: number;
  }) {
    const ids = normalizeMentionIds(params.mentionedUserIds);
    const highlightRepo = AppDataSource.getRepository(Highlight);
    const userRepo = AppDataSource.getRepository(User);

    const reel = await AppDataSource.getRepository(Reel).findOneBy({ id: params.reelId });
    Ensure.exists(reel, "reel");

    const current = await highlightRepo.find({
      where: { reel: { id: params.reelId } } as any,
      relations: ["user"],
    });
    const currentIds = new Set(current.map((row) => Number(row.user.id)));
    const nextIds = new Set(ids);

    const toDelete = current.filter((row) => !nextIds.has(Number(row.user.id)));
    if (toDelete.length > 0) {
      await highlightRepo.remove(toDelete);
    }

    const toCreateIds = ids.filter((id) => !currentIds.has(id));
    if (toCreateIds.length === 0) return;

    const foundUsers = await userRepo.findByIds(toCreateIds as any);
    const foundIds = new Set(foundUsers.map((user) => Number(user.id)));
    const validIds = toCreateIds.filter((id) => foundIds.has(id));
    if (validIds.length === 0) return;

    await highlightRepo.save(
      validIds.map((userId) =>
        highlightRepo.create({
          user: { id: userId } as User,
          reel: { id: params.reelId } as Reel,
          tournament: null,
        }),
      ),
    );

    const notificationService = new NotificationService();
    await Promise.all(
      validIds.map((userId) =>
        notificationService.notifyReelHighlight({
          receiverUserId: userId,
          reelId: params.reelId,
          mentionedByUserId: params.actorUserId,
        }),
      ),
    );
  }
}
