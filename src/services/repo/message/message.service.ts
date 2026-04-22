import { AppDataSource } from "../../../config/data_source";
import { ChatMember } from "../../../entities/ChatMember";
import { Message } from "../../../entities/Message";
import { Chat } from "../../../entities/Chat";
import { User } from "../../../entities/User";
import { Ensure } from "../../../common/errors/Ensure.handler";

export type MessageRow = {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
};

export class MessageService {
  private readonly repo = AppDataSource.getRepository(Message);

  private async ensureUserCanAccessChat(chatId: number, userId?: number) {
    Ensure.exists(userId, "user");
    const membership = await AppDataSource.getRepository(ChatMember).findOne({
      where: {
        chat: { id: chatId },
        user: { id: userId },
      } as any,
    });
    Ensure.exists(membership, "channel");
  }

  async listByChat(
    chatId: number,
    userId?: number,
    page = 1,
    limit = 50,
  ): Promise<{ data: MessageRow[]; total: number; page: number; limit: number }> {
    await this.ensureUserCanAccessChat(chatId, userId);
    const skip = (page - 1) * limit;

    const [messages, total] = await this.repo.findAndCount({
      where: { chat: { id: chatId } },
      relations: ["sender"],
      order: { created_at: "ASC" },
      skip,
      take: limit,
    });

    const data: MessageRow[] = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender?.id ?? 0,
      sender_name: msg.sender?.gamer_name ?? msg.sender?.full_name ?? "Admin",
      created_at: msg.created_at instanceof Date ? msg.created_at.toISOString() : String(msg.created_at),
    }));

    return { data, total, page, limit };
  }

  async createMessage(chatId: number, senderId: number, content: string): Promise<MessageRow> {
    const chatRepo = AppDataSource.getRepository(Chat);
    const chat = await chatRepo.findOneBy({ id: chatId });
    Ensure.exists(chat, "channel");
    await this.ensureUserCanAccessChat(chatId, senderId);

    const message = await this.repo.save(
      this.repo.create({
        chat: { id: chatId } as Chat,
        sender: { id: senderId } as User,
        content,
      }),
    );

    const saved = await this.repo.findOne({
      where: { id: message.id },
      relations: ["sender"],
    });

    return {
      id: saved!.id,
      content: saved!.content,
      sender_id: saved!.sender?.id ?? senderId,
      sender_name: saved!.sender?.gamer_name ?? saved!.sender?.full_name ?? "Admin",
      created_at: saved!.created_at instanceof Date ? saved!.created_at.toISOString() : String(saved!.created_at),
    };
  }
}
