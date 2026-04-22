import { Ensure } from "../../../common/errors/Ensure.handler";
import { Achievement } from "../../../entities/Achievement";
import {
  AppNotificationType,
  UserNotification,
} from "../../../entities/UserNotification";
import { logger } from "../../../logging/logger";
import { RepoService } from "../../repo.service";
import { UserService } from "../user/user.service";
import { ChatMemberService } from "../chat-member/chat-member.service";
import { In } from "typeorm";
import type { CreateAdminNotificationDto } from "../../../dto/admin/admin-notification.dto";
import { Friend } from "../../../entities/Friend";
import { getIO } from "../../../socket/io";

function dedupePositiveUserIds(ids: readonly number[]): number[] {
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

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BROADCAST_PAGE_SIZE = 200;
const EXPO_CHUNK = 100;

function numericFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

type CreatePayload = {
  type: AppNotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

type NotifyGlobalPollParams = {
  pollId: number;
  title: string;
  body: string;
  deepLink: string;
  target: "all" | "selected";
  userIds?: number[];
};

export class NotificationService extends RepoService<UserNotification> {
  constructor() {
    super(UserNotification);
    this.listForUser = this.listForUser.bind(this);
    this.markRead = this.markRead.bind(this);
    this.registerExpoPushToken = this.registerExpoPushToken.bind(this);
    this.notifyFriendRequest = this.notifyFriendRequest.bind(this);
    this.notifyTournamentCreated = this.notifyTournamentCreated.bind(this);
    this.notifyAchievementUnlocked = this.notifyAchievementUnlocked.bind(this);
    this.notifyReelHighlight = this.notifyReelHighlight.bind(this);
    this.notifyManualToUsers = this.notifyManualToUsers.bind(this);
    this.notifyChatMessageForChannelMembers = this.notifyChatMessageForChannelMembers.bind(this);
    this.notifyGlobalPoll = this.notifyGlobalPoll.bind(this);
  }

  async listForUser(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [rows, total] = await this.repo.findAndCount({
      where: { user: { id: userId } } as any,
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const friendRequestPairs = rows
      .filter((row) => row.type === "FRIEND_REQUEST")
      .map((row) => ({
        notificationId: row.id,
        fromUserId: numericFromUnknown((row.data ?? {})["fromUserId"]),
      }))
      .filter((pair): pair is { notificationId: number; fromUserId: number } => pair.fromUserId != null);

    const friendStatusByRequester = new Map<number, string>();
    if (friendRequestPairs.length > 0) {
      const requesterIds = Array.from(new Set(friendRequestPairs.map((pair) => pair.fromUserId)));
      const friendRows = await this.repo.manager.getRepository(Friend).find({
        where: requesterIds.map((requesterId) => ({
          user_id: requesterId,
          friend_user_id: userId,
        })) as any,
      });
      for (const row of friendRows) {
        friendStatusByRequester.set(Number(row.user_id), String(row.status ?? "pending"));
      }
    }

    const data = rows.map((n) => {
      const payload = { ...(n.data ?? {}) } as Record<string, unknown>;
      if (n.type === "FRIEND_REQUEST") {
        const fromUserId = numericFromUnknown(payload.fromUserId);
        const status = fromUserId != null ? friendStatusByRequester.get(fromUserId) ?? "rejected" : "pending";
        payload.status = status;
      }
      return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: payload,
      read_at: n.read_at ? n.read_at.toISOString() : null,
      created_at: n.created_at instanceof Date ? n.created_at.toISOString() : String(n.created_at),
      };
    });

    return { data, total, page, limit };
  }

  async markRead(userId: number, notificationId: number) {
    const n = await this.repo.findOne({
      where: { id: notificationId } as any,
      relations: ["user"],
    });
    Ensure.exists(n, "notification");
    Ensure.forbidden(Number((n as any).user?.id) === Number(userId), "notification");
    (n as UserNotification).read_at = new Date();
    await this.repo.save(n);
    return {
      id: n.id,
      read_at: (n as UserNotification).read_at!.toISOString(),
    };
  }

  async registerExpoPushToken(userId: number, token: string) {
    const userService = new UserService();
    await userService.setExpoPushToken(userId, token);
    return { ok: true };
  }

  async createForUser(userId: number, payload: CreatePayload) {
    const created = await this.create({
      user: { id: userId } as any,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      read_at: null,
    } as any);
    this.emitRealtimeToUsers([userId], [created]);
    return created;
  }

  async createForUsers(userIds: number[], payload: CreatePayload) {
    if (userIds.length === 0) return;
    const rows = userIds.map((userId) =>
      Object.assign(new UserNotification(), {
        user: { id: userId } as any,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        read_at: null as Date | null,
      })
    );
    const created = await this.repo.save(rows);
    this.emitRealtimeToUsers(userIds, created);
  }

  private emitRealtimeToUsers(userIds: number[], rows: UserNotification[]) {
    const io = getIO();
    if (!io || userIds.length === 0 || rows.length === 0) return;

    for (let i = 0; i < userIds.length; i += 1) {
      const userId = Number(userIds[i]);
      const row = rows[i];
      if (!Number.isInteger(userId) || userId <= 0 || !row) continue;
      io.to(`user:${userId}`).emit("notification:new", {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data ?? {},
        read_at: row.read_at ? row.read_at.toISOString() : null,
        created_at:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
      });
    }
  }

  private async sendPushToUsers(
    userIds: number[],
    title: string,
    body: string,
    data: Record<string, unknown> | null
  ) {
    const userService = new UserService();
    const withTokens = await userService.findPushTokensForUserIds(userIds);
    const messages = withTokens.map((u) => ({
      to: u.expo_push_token,
      title,
      body,
      sound: "default" as const,
      data: {
        ...(data ?? {}),
        title,
        body,
        type: data?.type ?? undefined,
      },
    }));
    await this.sendExpoPushBatch(messages);
  }

  private async sendExpoPushBatch(
    messages: { to: string; title: string; body: string; sound: "default"; data: Record<string, unknown> }[]
  ) {
    for (let i = 0; i < messages.length; i += EXPO_CHUNK) {
      const chunk = messages.slice(i, i + EXPO_CHUNK);
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chunk),
        });
        if (!res.ok) {
          const text = await res.text();
          logger.warn(`Expo push non-OK ${res.status}: ${text}`);
        }
      } catch (err) {
        logger.warn("Expo push request failed", err);
      }
    }
  }

  async notifyFriendRequest(params: { receiverUserId: number; fromUserId: number }) {
    const userService = new UserService();
    const requester = await userService.findOneByCondition({ id: params.fromUserId } as any);
    Ensure.exists(requester, "user");
    const title = "طلب صداقة جديد";
    const body = `قام ${requester.gamer_name} بإرسال طلب صداقة`;
    const data: Record<string, unknown> = {
      type: "FRIEND_REQUEST",
      userId: params.receiverUserId,
      fromUserId: params.fromUserId,
      requesterGamerName: requester.gamer_name,
      status: "pending",
      target: "friends",
      focusTab: "requests",
      focusUserId: params.fromUserId,
      hasActions: true,
    };
    try {
      await this.createForUser(params.receiverUserId, {
        type: "FRIEND_REQUEST",
        title,
        body,
        data,
      });
      await this.sendPushToUsers([params.receiverUserId], title, body, data);
    } catch (err) {
      logger.warn("notifyFriendRequest failed", err);
    }
  }

  async notifyTournamentCreated(tournamentId: number, tournamentTitle: string) {
    const userService = new UserService();
    const title = "بطولة جديدة";
    const body = tournamentTitle;
    const data: Record<string, unknown> = {
      type: "TOURNAMENT_CREATED",
      tournamentId,
      target: "tournament",
    };
    try {
      let page = 1;
      while (true) {
        const { ids, total } = await userService.getActiveUserIdsPage(page, BROADCAST_PAGE_SIZE);
        if (ids.length === 0) break;
        await this.createForUsers(ids, {
          type: "TOURNAMENT_CREATED",
          title,
          body,
          data,
        });
        await this.sendPushToUsers(ids, title, body, data);
        if (page * BROADCAST_PAGE_SIZE >= total) break;
        page += 1;
      }
    } catch (err) {
      logger.warn("notifyTournamentCreated failed", err);
    }
  }

  async notifyAchievementUnlocked(params: {
    userId: number;
    userAchievementId: number;
    achievement: Achievement;
  }) {
    const title = "تم فتح إنجاز جديد";
    const body = `حصلت على الإنجاز: ${params.achievement.name}`;
    const data: Record<string, unknown> = {
      type: "ACHIEVEMENT_UNLOCKED",
      achievementId: params.achievement.id,
      userAchievementId: params.userAchievementId,
      target: "achievements",
      focusAchievementId: params.achievement.id,
    };
    try {
      await this.createForUser(params.userId, {
        type: "ACHIEVEMENT_UNLOCKED",
        title,
        body,
        data,
      });
      await this.sendPushToUsers([params.userId], title, body, data);
    } catch (err) {
      logger.warn("notifyAchievementUnlocked failed", err);
    }
  }

  async notifyReelHighlight(params: {
    receiverUserId: number;
    reelId: number;
    mentionedByUserId: number;
    commentId?: number;
  }) {
    const userService = new UserService();
    const actor = await userService.findOneByCondition({ id: params.mentionedByUserId } as any);
    Ensure.exists(actor, "user");
    const title = "تم ذكرك في هايلايت";
    const body = `${actor.gamer_name} قام بذكرك في ريل مميز`;
    const data: Record<string, unknown> = {
      type: "REEL_HIGHLIGHT",
      reelId: params.reelId,
      mentionedByUserId: params.mentionedByUserId,
      creatorId: params.mentionedByUserId,
      target: "reel",
      openComments: params.commentId != null,
      commentId: params.commentId ?? null,
    };
    try {
      await this.createForUser(params.receiverUserId, {
        type: "REEL_HIGHLIGHT",
        title,
        body,
        data,
      });
      await this.sendPushToUsers([params.receiverUserId], title, body, data);
    } catch (err) {
      logger.warn("notifyReelHighlight failed", err);
    }
  }

  async notifyManualToUsers(dto: CreateAdminNotificationDto) {
    const userIds = dedupePositiveUserIds(dto.user_ids);
    Ensure.custom(userIds.length > 0, "Select at least one user");

    const userService = new UserService();
    const found = await userService.count({ id: In(userIds) } as any);
    Ensure.custom(found === userIds.length, "One or more users were not found");

    const title = dto.title;
    const body = dto.description;
    const data: Record<string, unknown> = {
      type: "MANUAL",
      route: dto.route ?? "",
      actionLabel: dto.action_label ?? "",
      target: dto.route ? "manual_route" : "message_only",
    };
    try {
      await this.createForUsers(userIds, {
        type: "MANUAL",
        title,
        body,
        data,
      });
      await this.sendPushToUsers(userIds, title, body, data);
    } catch (err) {
      logger.warn("notifyManualToUsers failed", err);
    }
  }

  async notifyGlobalPoll(params: NotifyGlobalPollParams) {
    const data: Record<string, unknown> = {
      type: "GLOBAL_POLL",
      pollId: params.pollId,
      route: params.deepLink,
      deepLink: params.deepLink,
      notificationType: "global_poll",
      target: "arena_voting",
      focusPollId: params.pollId,
    };

    try {
      if (params.target === "all") {
        const userService = new UserService();
        let page = 1;
        while (true) {
          const { ids, total } = await userService.getActiveUserIdsPage(page, BROADCAST_PAGE_SIZE);
          if (ids.length === 0) break;
          await this.createForUsers(ids, {
            type: "GLOBAL_POLL",
            title: params.title,
            body: params.body,
            data,
          });
          await this.sendPushToUsers(ids, params.title, params.body, data);
          if (page * BROADCAST_PAGE_SIZE >= total) break;
          page += 1;
        }
        return;
      }

      const userIds = dedupePositiveUserIds(params.userIds ?? []);
      Ensure.custom(userIds.length > 0, "Select at least one user");

      const userService = new UserService();
      const found = await userService.count({ id: In(userIds) } as any);
      Ensure.custom(found === userIds.length, "One or more users were not found");

      await this.createForUsers(userIds, {
        type: "GLOBAL_POLL",
        title: params.title,
        body: params.body,
        data,
      });
      await this.sendPushToUsers(userIds, params.title, params.body, data);
    } catch (err) {
      logger.warn("notifyGlobalPoll failed", err);
    }
  }

  async notifyChatMessageForChannelMembers(params: {
    channelId: number;
    senderId: number;
    contentPreview: string;
    channelTitle?: string;
  }) {
    const memberService = new ChatMemberService();
    const userIds = await memberService.getUserIdsByChatId(params.channelId);
    const recipients = userIds.filter((id) => id !== params.senderId);
    if (recipients.length === 0) return;

    const title = params.channelTitle?.trim() || "New message";
    const body =
      params.contentPreview.length > 120
        ? `${params.contentPreview.slice(0, 117)}...`
        : params.contentPreview;
    const data: Record<string, unknown> = {
      type: "CHAT_MESSAGE",
      chatId: params.channelId,
      target: "chat",
      messagePreview: body,
    };

    try {
      await this.createForUsers(recipients, {
        type: "CHAT_MESSAGE",
        title,
        body,
        data,
      });
      await this.sendPushToUsers(recipients, title, body, data);
    } catch (err) {
      logger.warn("notifyChatMessageForChannelMembers failed", err);
    }
  }

  /** Optional hook for winner / system announcements (e.g. tournament results). */
  async notifySystemUsers(userIds: number[], title: string, body: string, extraData?: Record<string, unknown>) {
    const data: Record<string, unknown> = {
      type: "SYSTEM_MESSAGE",
      target: extraData?.route ? "manual_route" : "message_only",
      ...(extraData ?? {}),
    };
    try {
      await this.createForUsers(userIds, {
        type: "SYSTEM_MESSAGE",
        title,
        body,
        data,
      });
      await this.sendPushToUsers(userIds, title, body, data);
    } catch (err) {
      logger.warn("notifySystemUsers failed", err);
    }
  }
}
