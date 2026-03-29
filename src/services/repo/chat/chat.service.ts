import { Chat } from "../../../entities/Chat";
import { GetChannelsQueryDto } from "../../../dto/chat/get-channels-query.dto";
import { ChatMemberService } from "../chat-member/chat-member.service";
import { RepoService } from "../../repo.service";

export type ChatListRow = {
  id: number;
  chat_type: string;
  title: string;
  allow_user_messages: boolean;
  tournament_id: number | null;
  member_count: number;
  created_at: string;
};

/** @deprecated Use ChatListRow */
export type PublicChannelRow = ChatListRow;

export class ChatService extends RepoService<Chat> {
  constructor() {
    super(Chat);
    this.findByTournamentId = this.findByTournamentId.bind(this);
    this.listChats = this.listChats.bind(this);
    this.listPublicChannels = this.listPublicChannels.bind(this);
  }

  async findByTournamentId(tournamentId: number) {
    return await this.findOneByCondition({
      tournament: { id: tournamentId },
    } as any);
  }

  /**
   * Paginated all chats (`channel` and `direct`), newest first.
   */
  async listChats(query: GetChannelsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const { data, total, page: p, limit: l } = await this.getAllWithPagination({
      page,
      limit,
      order: { created_at: "DESC" } as any,
      relations: ["tournament"] as any,
    });

    const memberService = new ChatMemberService();
    const rows: ChatListRow[] = await Promise.all(
      data.map(async (chat: Chat) => {
        const member_count = await memberService.countByChatId(chat.id);
        const created =
          chat.created_at instanceof Date
            ? chat.created_at.toISOString()
            : String(chat.created_at);
        return {
          id: chat.id,
          chat_type: chat.type,
          title: chat.title ?? "",
          allow_user_messages: chat.allow_user_messages,
          tournament_id: chat.tournament?.id ?? null,
          member_count,
          created_at: created,
        };
      })
    );

    return { data: rows, total, page: p, limit: l };
  }

  /** @deprecated Use listChats — kept for backwards compatibility */
  async listPublicChannels(query: GetChannelsQueryDto) {
    return this.listChats(query);
  }
}
