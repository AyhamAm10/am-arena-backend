import { Ensure } from "../../../common/errors/Ensure.handler";
import { ChatMember } from "../../../entities/ChatMember";
import { RepoService } from "../../repo.service";

export class ChatMemberService extends RepoService<ChatMember> {
  constructor() {
    super(ChatMember);
    this.addMember = this.addMember.bind(this);
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
