import { Chat } from "../../../entities/Chat";
import { AppDataSource } from "../../../config/data_source";
import { Ensure } from "../../../common/errors/Ensure.handler";
import { GetChannelsQueryDto } from "../../../dto/chat/get-channels-query.dto";
import { ChatMember } from "../../../entities/ChatMember";
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
   * Paginated channels the current user is authorized to access.
   */
  async listChats(query: GetChannelsQueryDto, currentUserId?: number) {
    Ensure.exists(currentUserId, "user");
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const qb = AppDataSource.getRepository(Chat)
      .createQueryBuilder("chat")
      .innerJoin(
        ChatMember,
        "membership",
        "membership.chat_id = chat.id AND membership.user_id = :userId",
        { userId: currentUserId },
      )
      .leftJoinAndSelect("chat.tournament", "tournament")
      .where("chat.type = :chatType", { chatType: "channel" })
      .orderBy("chat.created_at", "DESC")
      .skip(skip)
      .take(limit);

    const [data, total] = await Promise.all([
      qb.getMany(),
      qb.clone().skip(undefined).take(undefined).getCount(),
    ]);

    const memberCounts = new Map<number, number>();
    if (data.length > 0) {
      const counts = await AppDataSource.getRepository(ChatMember)
        .createQueryBuilder("member")
        .select("member.chat_id", "chat_id")
        .addSelect("COUNT(*)", "member_count")
        .where("member.chat_id IN (:...chatIds)", {
          chatIds: data.map((chat) => chat.id),
        })
        .groupBy("member.chat_id")
        .getRawMany<{ chat_id: string; member_count: string }>();

      for (const row of counts) {
        memberCounts.set(Number(row.chat_id), Number(row.member_count));
      }
    }

    const rows: ChatListRow[] = data.map((chat: Chat) => {
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
        member_count: memberCounts.get(chat.id) ?? 0,
        created_at: created,
      };
    });

    return { data: rows, total, page, limit };
  }

  /** @deprecated Use listChats — kept for backwards compatibility */
  async listPublicChannels(query: GetChannelsQueryDto) {
    return this.listChats(query);
  }
}
