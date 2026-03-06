import { Chat } from "../../../entities/Chat";
import { RepoService } from "../../repo.service";

export class ChatService extends RepoService<Chat> {
  constructor() {
    super(Chat);
    this.findByTournamentId = this.findByTournamentId.bind(this);
  }

  async findByTournamentId(tournamentId: number) {
    return await this.findOneByCondition({
      tournament: { id: tournamentId },
    } as any);
  }
}
