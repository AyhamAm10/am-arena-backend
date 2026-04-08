import type { Server, Socket } from "socket.io";
import { JwtService } from "../services/jwt/jwt.service";
import { AppDataSource } from "../config/data_source";
import { Chat, ChatType } from "../entities/Chat";
import { ChatMember } from "../entities/ChatMember";
import { logger } from "../logging/logger";

export function registerChatGateway(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = JwtService.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as number;
    logger.info(`Socket connected: user=${userId} sid=${socket.id}`);

    socket.on("join-channel", async (channelId: number) => {
      try {
        const chat = await AppDataSource.getRepository(Chat).findOneBy({ id: channelId });
        if (!chat) {
          socket.emit("error-message", "Channel not found");
          return;
        }

        if (chat.type === ChatType.DIRECT) {
          const isMember = await AppDataSource.getRepository(ChatMember).count({
            where: { chat: { id: channelId }, user: { id: userId } },
          });
          if (!isMember) {
            socket.emit("error-message", "You are not a member of this conversation");
            return;
          }
        }

        const room = `channel:${channelId}`;
        await socket.join(room);
        logger.info(`User ${userId} joined room ${room}`);
      } catch (err) {
        logger.error("join-channel error:", err);
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
