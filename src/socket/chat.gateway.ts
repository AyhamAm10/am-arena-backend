import type { Server, Socket } from "socket.io";
import { getRedisClient } from "../config/redis.client";
import { JwtService } from "../services/jwt/jwt.service";
import { AppDataSource } from "../config/data_source";
import { Chat } from "../entities/Chat";
import { ChatMember } from "../entities/ChatMember";
import { User } from "../entities/User";
import { logger } from "../logging/logger";
import { formatErrorForLog } from "../logging/errorDiagnostics";

const SOCKET_RATE_LIMIT_WINDOW_MS = 60_000;
const CONNECT_RATE_LIMIT = 40;
const JOIN_RATE_LIMIT = 30;
const memoryRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

async function isSocketRateLimited(
  scope: string,
  identity: string,
  limit: number,
  windowMs = SOCKET_RATE_LIMIT_WINDOW_MS,
) {
  const key = `socket-rate:${scope}:${identity}`;
  const redis = getRedisClient();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }
    return count > limit;
  }

  const now = Date.now();
  const existing = memoryRateLimitBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryRateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  existing.count += 1;
  memoryRateLimitBuckets.set(key, existing);
  return existing.count > limit;
}

export function registerChatGateway(io: Server) {
  io.use(async (socket, next) => {
    const ip = socket.handshake.address || "unknown";
    if (await isSocketRateLimited("connect", ip, CONNECT_RATE_LIMIT)) {
      return next(new Error("Too many connection attempts"));
    }

    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = JwtService.verifyAccessToken(token);
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: payload.userId },
        select: ["id", "is_active"],
      });
      if (!user?.is_active) {
        return next(new Error("Account inactive"));
      }
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as number;
    logger.info(`Socket connected: user=${userId} sid=${socket.id}`);
    void socket.join(`user:${userId}`);

    socket.on("join-channel", async (channelId: number) => {
      try {
        if (await isSocketRateLimited("join-channel", String(userId), JOIN_RATE_LIMIT)) {
          socket.emit("error-message", "Too many channel join attempts");
          return;
        }

        const chat = await AppDataSource.getRepository(Chat).findOneBy({ id: channelId });
        if (!chat) {
          socket.emit("error-message", "Channel not found");
          return;
        }

        const isMember = await AppDataSource.getRepository(ChatMember).count({
          where: { chat: { id: channelId }, user: { id: userId } },
        });
        if (!isMember) {
          socket.emit("error-message", "You are not a member of this channel");
          return;
        }

        const room = `channel:${channelId}`;
        await socket.join(room);
        logger.info(`User ${userId} joined room ${room}`);
      } catch (err) {
        logger.log({
          level: "error",
          message: "socket_join_channel_error",
          event: "socket_join_channel_error",
          userId,
          channelId,
          err: formatErrorForLog(err),
        });
        socket.emit("error-message", "Failed to join channel");
      }
    });

    socket.on("leave-channel", async (channelId: number) => {
      const room = `channel:${channelId}`;
      await socket.leave(room);
      logger.info(`User ${userId} left room ${room}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: user=${userId} sid=${socket.id}`);
    });
  });
}
