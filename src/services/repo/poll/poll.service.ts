import { APIError, HttpStatusCode } from "../../../common/errors/api.error";
import { Ensure } from "../../../common/errors/Ensure.handler";
import { AppDataSource } from "../../../config/data_source";
import { In } from "typeorm";
import type {
  AddPollOptionDto,
  CreatePollDto,
  ListPollsQueryDto,
  NotifyGlobalPollDto,
  PollAnalyticsQueryDto,
  UpdatePollDto,
} from "../../../dto/poll/poll.dto";
import { Chat, ChatType } from "../../../entities/Chat";
import { ChatMember } from "../../../entities/ChatMember";
import { Message } from "../../../entities/Message";
import { Poll } from "../../../entities/Poll";
import { PollOption } from "../../../entities/PollOption";
import { PubgRegistration } from "../../../entities/PubgRegistration";
import { Tournament } from "../../../entities/Tournament";
import { User, UserRole } from "../../../entities/User";
import { Vote } from "../../../entities/Vote";
import { NotificationService } from "../notification/notification.service";
import { RepoService } from "../../repo.service";
import { serializeUserRef } from "../../../utils/serialize-user";
import { PubgTournamentService } from "../pubg-tournament/pubg-tournament.service";

type PollType = Poll["type"];
type PollSummary = {
  id: number;
  title: string;
  description: string;
  type: PollType;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  tournament_id: number | null;
  chat_id: number | null;
  message_id: number | null;
  total_votes: number;
  options_count: number;
};

function toIsoOrNull(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isPollClosed(poll: Poll) {
  if (!poll.is_active) return true;
  if (!poll.expires_at) return false;
  return new Date(poll.expires_at).getTime() <= Date.now();
}

function normalizeOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  Ensure.custom(!Number.isNaN(parsed.getTime()), "Invalid expiry date");
  return parsed;
}

function normalizeUserIds(ids: readonly number[]) {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const raw of ids) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export class PollService extends RepoService<Poll> {
  constructor() {
    super(Poll);
    this.createPoll = this.createPoll.bind(this);
    this.updatePoll = this.updatePoll.bind(this);
    this.deletePoll = this.deletePoll.bind(this);
    this.addOption = this.addOption.bind(this);
    this.removeOption = this.removeOption.bind(this);
    this.listPolls = this.listPolls.bind(this);
    this.getPollById = this.getPollById.bind(this);
    this.getTournamentPolls = this.getTournamentPolls.bind(this);
    this.getChatPolls = this.getChatPolls.bind(this);
    this.castVote = this.castVote.bind(this);
    this.getPollAnalytics = this.getPollAnalytics.bind(this);
    this.notifyGlobalPoll = this.notifyGlobalPoll.bind(this);
  }

  private pollRepo = AppDataSource.getRepository(Poll);
  private pollOptionRepo = AppDataSource.getRepository(PollOption);
  private voteRepo = AppDataSource.getRepository(Vote);
  private tournamentRepo = AppDataSource.getRepository(Tournament);
  private chatRepo = AppDataSource.getRepository(Chat);
  private chatMemberRepo = AppDataSource.getRepository(ChatMember);
  private userRepo = AppDataSource.getRepository(User);
  private registrationRepo = AppDataSource.getRepository(PubgRegistration);
  private messageRepo = AppDataSource.getRepository(Message);

  private async getPollEntityOrFail(pollId: number) {
    const poll = await this.pollRepo.findOne({
      where: { id: pollId },
      relations: [
        "options",
        "options.user",
        "tournament",
        "chat",
        "message",
      ],
    });
    Ensure.exists(poll, "poll");
    return poll!;
  }

  private async validatePollPayload(dto: CreatePollDto) {
    if (dto.type === "tournament") {
      Ensure.custom(dto.tournament_id != null, "Tournament poll requires tournament_id");
      Ensure.custom(dto.chat_id == null, "Tournament poll cannot target a chat");
      const tournament = await this.tournamentRepo.findOneBy({ id: Number(dto.tournament_id) });
      Ensure.exists(tournament, "tournament");
      return { tournament, chat: null as Chat | null };
    }

    if (dto.type === "message") {
      Ensure.custom(dto.chat_id != null, "Message poll requires chat_id");
      Ensure.custom(dto.tournament_id == null, "Message poll cannot target a tournament");
      const chat = await this.chatRepo.findOne({
        where: { id: Number(dto.chat_id) },
        relations: ["tournament"],
      });
      Ensure.exists(chat, "chat");
      Ensure.custom(chat!.type === ChatType.CHANNEL, "Message polls are only supported for channels");
      return { tournament: null as Tournament | null, chat: chat! };
    }

    Ensure.custom(dto.tournament_id == null, "Global poll cannot target a tournament");
    Ensure.custom(dto.chat_id == null, "Global poll cannot target a chat");
    return { tournament: null as Tournament | null, chat: null as Chat | null };
  }

  private async validateOptionPayloads(
    pollType: PollType,
    options: Array<CreatePollDto["options"][number]>,
    tournamentId?: number | null,
    chatId?: number | null,
  ) {
    const normalizedUserIds = normalizeUserIds(
      options
        .filter((option) => option.type === "user")
        .map((option) => Number(option.user_id ?? 0)),
    );

    const duplicateUserIds = normalizedUserIds.filter(
      (id, index) => normalizedUserIds.indexOf(id) !== index,
    );
    Ensure.custom(duplicateUserIds.length === 0, "Duplicate user-based options are not allowed");

    if (pollType === "global") {
      Ensure.custom(
        options.every((option) => option.type === "text"),
        "Global polls support text options only",
      );
    }

    if (pollType === "tournament") {
      const registrationRows = await this.registrationRepo.find({
        where: { tournament: { id: Number(tournamentId) } } as any,
        relations: ["user"],
      });
      const registeredUserIds = new Set(registrationRows.map((row) => Number(row.user?.id)));
      for (const option of options) {
        if (option.type === "text") {
          Ensure.required(option.label?.trim(), "option label");
          continue;
        }
        Ensure.custom(option.user_id != null, "User option requires user_id");
        Ensure.custom(
          registeredUserIds.has(Number(option.user_id)),
          "Tournament user options must belong to registered participants",
        );
      }
      return;
    }

    if (pollType === "message") {
      const members = await this.chatMemberRepo.find({
        where: { chat: { id: Number(chatId) } } as any,
        select: ["user_id"],
      });
      const memberIds = new Set(members.map((member) => Number((member as any).user_id)));
      for (const option of options) {
        if (option.type === "text") {
          Ensure.required(option.label?.trim(), "option label");
          continue;
        }
        Ensure.custom(option.user_id != null, "User option requires user_id");
        Ensure.custom(
          memberIds.has(Number(option.user_id)),
          "Channel user options must belong to channel members",
        );
      }
      return;
    }

    for (const option of options) {
      Ensure.required(option.label?.trim(), "option label");
    }
  }

  private async createOptionsForPoll(pollId: number, dtoOptions: CreatePollDto["options"]) {
    await this.pollOptionRepo.save(
      dtoOptions.map((option) =>
        this.pollOptionRepo.create({
          poll: { id: pollId } as Poll,
          label: option.type === "text" ? option.label?.trim() ?? "" : option.label?.trim() ?? null,
          type: option.type,
          user: option.user_id ? ({ id: Number(option.user_id) } as User) : null,
        }),
      ),
    );
  }

  private buildPollSummary(poll: Poll, totalVotes = 0): PollSummary {
    return {
      id: poll.id,
      title: poll.title,
      description: poll.description ?? "",
      type: poll.type,
      is_active: poll.is_active,
      expires_at: toIsoOrNull(poll.expires_at),
      created_at: toIsoOrNull(poll.created_at) ?? "",
      updated_at: toIsoOrNull(poll.updated_at) ?? "",
      tournament_id: poll.tournament?.id ?? null,
      chat_id: poll.chat?.id ?? null,
      message_id: poll.message?.id ?? null,
      total_votes: totalVotes,
      options_count: poll.options?.length ?? 0,
    };
  }

  private buildPollDetails(
    poll: Poll,
    optionCounts: Map<number, number>,
    totalVotes: number,
    currentVoteOptionId: number | null,
  ) {
    return {
      ...this.buildPollSummary(poll, totalVotes),
      closed: isPollClosed(poll),
      current_user_vote_option_id: currentVoteOptionId,
      options: poll.options.map((option) => {
        const votesCount = optionCounts.get(option.id) ?? 0;
        return {
          id: option.id,
          label: option.label,
          type: option.type,
          votes_count: votesCount,
          percentage: totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0,
          selected: currentVoteOptionId === option.id,
          user: option.user ? serializeUserRef(option.user) : null,
        };
      }),
    };
  }

  private async buildVoteAggregates(
    pollIds: number[],
    currentUserId?: number | null,
  ) {
    const counts = await this.voteRepo
      .createQueryBuilder("vote")
      .select('"vote"."pollId"', "pollId")
      .addSelect('"vote"."optionId"', "optionId")
      .addSelect("COUNT(*)", "count")
      .where('"vote"."pollId" IN (:...pollIds)', { pollIds })
      .groupBy('"vote"."pollId"')
      .addGroupBy('"vote"."optionId"')
      .getRawMany<{ pollId: string; optionId: string; count: string }>();

    const optionCountsByPoll = new Map<number, Map<number, number>>();
    const totalsByPoll = new Map<number, number>();
    for (const row of counts) {
      const pollId = Number(row.pollId);
      const optionId = Number(row.optionId);
      const count = Number(row.count);
      const optionCounts = optionCountsByPoll.get(pollId) ?? new Map<number, number>();
      optionCounts.set(optionId, count);
      optionCountsByPoll.set(pollId, optionCounts);
      totalsByPoll.set(pollId, (totalsByPoll.get(pollId) ?? 0) + count);
    }

    const currentVoteByPoll = new Map<number, number | null>();
    if (currentUserId) {
      const currentVotes = await this.voteRepo
        .createQueryBuilder("vote")
        .select('"vote"."pollId"', "pollId")
        .addSelect('"vote"."optionId"', "optionId")
        .where('"vote"."pollId" IN (:...pollIds)', { pollIds })
        .andWhere('"vote"."userId" = :userId', { userId: currentUserId })
        .getRawMany<{ pollId: string; optionId: string }>();
      for (const row of currentVotes) {
        currentVoteByPoll.set(Number(row.pollId), Number(row.optionId));
      }
    }

    return { optionCountsByPoll, totalsByPoll, currentVoteByPoll };
  }

  private async ensureUserCanVote(poll: Poll, userId: number) {
    Ensure.custom(!isPollClosed(poll), "This poll is closed");

    if (poll.type === "tournament") {
      Ensure.exists(poll.tournament, "tournament");
      const registration = await this.registrationRepo.findOne({
        where: {
          tournament: { id: poll.tournament!.id },
          user: { id: userId },
        } as any,
      });
      Ensure.custom(!!registration, "Only tournament participants can vote in this poll");
      return;
    }

    if (poll.type === "message") {
      Ensure.exists(poll.chat, "chat");
      const membership = await this.chatMemberRepo.findOne({
        where: {
          chat: { id: poll.chat!.id },
          user: { id: userId },
        } as any,
      });
      Ensure.custom(!!membership, "Only channel members can vote in this poll");
      return;
    }
  }

  async createPoll(currentUserId: number, dto: CreatePollDto) {
    const { tournament, chat } = await this.validatePollPayload(dto);
    await this.validateOptionPayloads(dto.type, dto.options, dto.tournament_id, dto.chat_id);

    return this.createWithTransaction(async (manager) => {
      const pollRepo = manager.getRepository(Poll);
      const optionRepo = manager.getRepository(PollOption);
      const messageRepo = manager.getRepository(Message);

      const poll = await pollRepo.save(
        pollRepo.create({
          title: dto.title.trim(),
          description: dto.description?.trim() ?? "",
          type: dto.type,
          tournament: tournament ? ({ id: tournament.id } as Tournament) : null,
          chat: chat ? ({ id: chat.id } as Chat) : null,
          expires_at: normalizeOptionalDate(dto.expires_at),
          is_active: dto.is_active ?? true,
        }),
      );

      await optionRepo.save(
        dto.options.map((option) =>
          optionRepo.create({
            poll: { id: poll.id } as Poll,
            label: option.type === "text" ? option.label?.trim() ?? "" : option.label?.trim() ?? null,
            type: option.type,
            user: option.user_id ? ({ id: Number(option.user_id) } as User) : null,
          }),
        ),
      );

      let linkedMessageId: number | null = null;
      if (dto.type === "message" && chat) {
        const pollMessage = await messageRepo.save(
          messageRepo.create({
            chat: { id: chat.id } as Chat,
            sender: { id: currentUserId } as User,
            type: "poll",
            content: dto.message_content?.trim() || dto.title.trim(),
            data: { pollId: poll.id, deep_link: `/channel/${chat.id}` },
            is_active: true,
          }),
        );
        linkedMessageId = pollMessage.id;
        poll.message = { id: pollMessage.id } as Message;
        await pollRepo.save(poll);
      }

      const created = await pollRepo.findOne({
        where: { id: poll.id },
        relations: ["options", "options.user", "tournament", "chat", "message"],
      });
      Ensure.exists(created, "poll");

      const totalVotes = 0;
      return {
        ...this.buildPollSummary(created!, totalVotes),
        options: created!.options.map((option) => ({
          id: option.id,
          label: option.label,
          type: option.type,
          user: option.user ? serializeUserRef(option.user) : null,
          votes_count: 0,
          percentage: 0,
          selected: false,
        })),
        linked_message_id: linkedMessageId,
      };
    });
  }

  async updatePoll(pollId: number, dto: UpdatePollDto) {
    const poll = await this.getPollEntityOrFail(pollId);
    if (dto.title !== undefined) poll.title = dto.title.trim();
    if (dto.description !== undefined) poll.description = dto.description.trim();
    if (dto.is_active !== undefined) poll.is_active = dto.is_active;
    if (dto.expires_at !== undefined) {
      poll.expires_at = normalizeOptionalDate(dto.expires_at);
    }
    await this.pollRepo.save(poll);
    return this.getPollById(pollId);
  }

  async deletePoll(pollId: number) {
    const poll = await this.getPollEntityOrFail(pollId);
    await this.pollRepo.remove(poll);
  }

  async addOption(pollId: number, dto: AddPollOptionDto) {
    const poll = await this.getPollEntityOrFail(pollId);
    await this.validateOptionPayloads(
      poll.type,
      [dto as CreatePollDto["options"][number]],
      poll.tournament?.id ?? null,
      poll.chat?.id ?? null,
    );
    const option = await this.pollOptionRepo.save(
      this.pollOptionRepo.create({
        poll: { id: poll.id } as Poll,
        label: dto.type === "text" ? dto.label?.trim() ?? "" : dto.label?.trim() ?? null,
        type: dto.type,
        user: dto.user_id ? ({ id: Number(dto.user_id) } as User) : null,
      }),
    );
    return {
      id: option.id,
      label: option.label,
      type: option.type,
      user_id: dto.user_id ?? null,
    };
  }

  async removeOption(pollId: number, optionId: number) {
    const option = await this.pollOptionRepo.findOne({
      where: {
        id: optionId,
        poll: { id: pollId },
      } as any,
    });
    Ensure.exists(option, "poll option");
    const count = await this.pollOptionRepo.count({
      where: { poll: { id: pollId } } as any,
    });
    Ensure.custom(count > 2, "A poll must keep at least two options");
    await this.pollOptionRepo.remove(option!);
  }

  async listPolls(query: ListPollsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const qb = this.pollRepo
      .createQueryBuilder("poll")
      .leftJoinAndSelect("poll.options", "option")
      .leftJoinAndSelect("option.user", "optionUser")
      .leftJoinAndSelect("poll.tournament", "tournament")
      .leftJoinAndSelect("poll.chat", "chat")
      .leftJoinAndSelect("poll.message", "message")
      .leftJoin("votes", "vote", '"vote"."pollId" = poll.id')
      .addSelect('COUNT(DISTINCT vote.id)', "votes_count")
      .groupBy("poll.id")
      .addGroupBy("option.id")
      .addGroupBy("optionUser.id")
      .addGroupBy("tournament.id")
      .addGroupBy("chat.id")
      .addGroupBy("message.id")
      .orderBy("poll.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.type) {
      qb.andWhere("poll.type = :type", { type: query.type });
    }
    if (query.is_active !== undefined) {
      qb.andWhere("poll.is_active = :isActive", { isActive: query.is_active });
    }
    if (query.tournament_id) {
      qb.andWhere('poll."tournamentId" = :tournamentId', { tournamentId: query.tournament_id });
    }
    if (query.chat_id) {
      qb.andWhere('poll."chatId" = :chatId', { chatId: query.chat_id });
    }
    if (query.search?.trim()) {
      qb.andWhere("poll.title ILIKE :search", { search: `%${query.search.trim()}%` });
    }

    const [rows, total] = await qb.getManyAndCount();
    const voteCounts = await this.voteRepo
      .createQueryBuilder("vote")
      .select('"vote"."pollId"', "pollId")
      .addSelect("COUNT(vote.id)", "count")
      .where('"vote"."pollId" IN (:...pollIds)', { pollIds: rows.map((poll) => poll.id).length ? rows.map((poll) => poll.id) : [0] })
      .groupBy('"vote"."pollId"')
      .getRawMany<{ pollId: string; count: string }>();
    const voteMap = new Map(voteCounts.map((row) => [Number(row.pollId), Number(row.count)]));

    return {
      data: rows.map((poll) => this.buildPollSummary(poll, voteMap.get(poll.id) ?? 0)),
      total,
      page,
      limit,
    };
  }

  async getPollById(pollId: number, currentUserId?: number | null) {
    const poll = await this.getPollEntityOrFail(pollId);
    const { optionCountsByPoll, totalsByPoll, currentVoteByPoll } =
      await this.buildVoteAggregates([pollId], currentUserId);
    return this.buildPollDetails(
      poll,
      optionCountsByPoll.get(pollId) ?? new Map<number, number>(),
      totalsByPoll.get(pollId) ?? 0,
      currentVoteByPoll.get(pollId) ?? null,
    );
  }

  async getTournamentPolls(tournamentId: number, currentUserId?: number | null) {
    await new PubgTournamentService().finalizeTournamentIfEnded(tournamentId);
    const polls = await this.pollRepo.find({
      where: { tournament: { id: tournamentId } } as any,
      relations: ["options", "options.user", "tournament", "chat", "message"],
      order: { created_at: "DESC" },
    });
    if (polls.length === 0) {
      return [];
    }
    const pollIds = polls.map((poll) => poll.id);
    const { optionCountsByPoll, totalsByPoll, currentVoteByPoll } =
      await this.buildVoteAggregates(pollIds, currentUserId);
    return polls.map((poll) =>
      this.buildPollDetails(
        poll,
        optionCountsByPoll.get(poll.id) ?? new Map<number, number>(),
        totalsByPoll.get(poll.id) ?? 0,
        currentVoteByPoll.get(poll.id) ?? null,
      )
    );
  }

  async getChatPolls(chatId: number, currentUserId?: number | null) {
    const polls = await this.pollRepo.find({
      where: { chat: { id: chatId } } as any,
      relations: ["options", "options.user", "tournament", "chat", "message"],
      order: { created_at: "DESC" },
    });
    if (polls.length === 0) {
      return [];
    }
    const pollIds = polls.map((poll) => poll.id);
    const { optionCountsByPoll, totalsByPoll, currentVoteByPoll } =
      await this.buildVoteAggregates(pollIds, currentUserId);
    return polls.map((poll) =>
      this.buildPollDetails(
        poll,
        optionCountsByPoll.get(poll.id) ?? new Map<number, number>(),
        totalsByPoll.get(poll.id) ?? 0,
        currentVoteByPoll.get(poll.id) ?? null,
      )
    );
  }

  async castVote(pollId: number, optionId: number, userId: number) {
    const poll = await this.getPollEntityOrFail(pollId);
    if (poll.tournament?.id) {
      await new PubgTournamentService().finalizeTournamentIfEnded(poll.tournament.id);
    }
    const refreshedPoll = await this.getPollEntityOrFail(pollId);
    const option = refreshedPoll.options.find((item) => item.id === optionId);
    Ensure.exists(option, "poll option");
    await this.ensureUserCanVote(refreshedPoll, userId);

    const existingVote = await this.voteRepo.findOne({
      where: {
        poll: { id: pollId },
        user: { id: userId },
      } as any,
    });
    if (existingVote) {
      throw new APIError(HttpStatusCode.CONFLICT, "You already voted in this poll");
    }

    try {
      await this.voteRepo.save(
        this.voteRepo.create({
          poll: { id: pollId } as Poll,
          option: { id: optionId } as PollOption,
          user: { id: userId } as User,
        }),
      );
    } catch {
      throw new APIError(HttpStatusCode.CONFLICT, "You already voted in this poll");
    }

    return this.getPollById(pollId, userId);
  }

  async getPollAnalytics(
    pollId: number,
    query: PollAnalyticsQueryDto,
    requesterRole?: UserRole | string | null,
  ) {
    const poll = await this.getPollEntityOrFail(pollId);
    const votes = await this.voteRepo.find({
      where: { poll: { id: pollId } } as any,
      relations: ["option", "user"],
      order: { created_at: "ASC" },
    });
    const totalVotes = votes.length;
    const includeVoters = Boolean(query.include_voters);
    const allowUserBreakdown =
      includeVoters &&
      requesterRole != null &&
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, "admin", "super_admin"].includes(requesterRole as UserRole);
    const exposeVoterBreakdown = allowUserBreakdown && poll.type !== "global";

    return {
      ...this.buildPollSummary(poll, totalVotes),
      closed: isPollClosed(poll),
      options: poll.options.map((option) => {
        const optionVotes = votes.filter((vote) => vote.option.id === option.id);
        return {
          id: option.id,
          label: option.label,
          type: option.type,
          votes_count: optionVotes.length,
          percentage: totalVotes > 0 ? Math.round((optionVotes.length / totalVotes) * 100) : 0,
          user: option.user ? serializeUserRef(option.user) : null,
          voters: exposeVoterBreakdown
            ? optionVotes.map((vote) => ({
                ...serializeUserRef(vote.user),
                voted_at: toIsoOrNull(vote.created_at),
              }))
            : [],
        };
      }),
    };
  }

  async notifyGlobalPoll(pollId: number, dto: NotifyGlobalPollDto) {
    const poll = await this.getPollEntityOrFail(pollId);
    Ensure.custom(poll.type === "global", "Only global polls can send global notifications");
    const notificationService = new NotificationService();
    const deepLink = `/space/polls/${poll.id}`;
    await notificationService.notifyGlobalPoll({
      pollId: poll.id,
      title: poll.title,
      body: poll.description?.trim() || poll.title,
      deepLink,
      target: dto.target,
      userIds: normalizeUserIds(dto.user_ids ?? []),
    });
    return { ok: true };
  }
}
