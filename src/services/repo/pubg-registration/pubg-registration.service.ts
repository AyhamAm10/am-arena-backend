import { PubgRegistration } from "../../../entities/PubgRegistration";
import { RepoService } from "../../repo.service";

type CreatePubgRegistrationParams = {
  tournamentId: number;
  userId: number;
  friends?: number[];
};

export class PubgRegistrationService extends RepoService<PubgRegistration> {
  constructor() {
    super(PubgRegistration);
    this.createPubgRegistration = this.createPubgRegistration.bind(this);
  }

  async createPubgRegistration(data: CreatePubgRegistrationParams) {
    return await this.create({
      tournament: { id: data.tournamentId } as any,
      user: { id: data.userId } as any,
      friends: (data.friends ?? []).map((id) => ({ id })) as any,
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

  async countByTournamentId(tournamentId: number): Promise<number> {
    return await this.repo.count({
      where: { tournament: { id: tournamentId } } as any,
    });
  }

  async getById(id: string | number) {
    return await super.getById(id);
  }

  async findByTournamentIdPaginated(tournamentId: number, skip: number, take: number) {
    return await this.repo.findAndCount({
      where: { tournament: { id: tournamentId } } as any,
      relations: ["user"],
      order: { registered_at: "DESC" } as any,
      skip,
      take,
    });
  }

  async deleteByTournamentAndUser(tournamentId: number, userId: number) {
    const reg = await this.findByTournamentAndUser(tournamentId, userId);
    if (reg) {
      await this.repo.delete((reg as any).id);
    }
    return reg;
  }
}
