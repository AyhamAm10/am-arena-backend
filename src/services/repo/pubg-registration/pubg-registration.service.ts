import { PubgRegistration } from "../../../entities/PubgRegistration";
import { RepoService } from "../../repo.service";

type CreatePubgRegistrationParams = {
  tournamentId: number;
  userId: number;
};

export class PubgRegistrationService extends RepoService<PubgRegistration> {
  constructor() {
    super(PubgRegistration);
  }

  async create(data: CreatePubgRegistrationParams) {
    return await super.create({
      tournament: { id: data.tournamentId } as any,
      user: { id: data.userId } as any,
      paid: false,
      registered_at: new Date(),
    });
  }

  async findByTournamentAndUser(tournamentId: number, userId: number) {
    return await this.findOneByCondition({
      tournament: { id: tournamentId },
      user: { id: userId },
    } as any);
  }

  async getById(id: string | number) {
    return await super.getById(id);
  }
}
