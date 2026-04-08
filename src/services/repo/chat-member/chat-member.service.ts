import { Ensure } from "../../../common/errors/Ensure.handler";
import { ChatMember } from "../../../entities/ChatMember";
import { RepoService } from "../../repo.service";

export class ChatMemberService extends RepoService<ChatMember> {
  constructor() {
    super(ChatMember);
    this.addMember = this.addMember.bind(this);
    this.getUserIdsByChatId = this.getUserIdsByChatId.bind(this);
  }

  async getUserIdsByChatId(chatId: number): Promise<number[]> {
    const rows = await this.repo.find({
      where: { chat: { id: chatId } } as any,
      select: ["user_id"],
    });
    return rows.map((r: any) => Number(r.user_id));
  }

  async addMember(chatId: number, userId: number) {
    const existing = await this.findOneByCondition({
      chat_id: chatId,
      user_id: userId,
    } as any);
    Ensure.custom(!existing, "User is already a member of this chat");

    return await this.create({
      chat_id: chatId,
      user_id: userId,
    } as any);
  }

  async countByChatId(chatId: number): Promise<number> {
    return await this.repo.count({
      where: { chat: { id: chatId } } as any,
    });
  }
}
