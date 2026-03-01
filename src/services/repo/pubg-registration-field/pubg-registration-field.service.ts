import { PubgRegistrationField } from "../../../entities/PubgRegistrationField";
import { RepoService } from "../../repo.service";

type CreatePubgRegistrationFieldParams = {
  tournamentId: number;
  label: string;
  type: string;
  options?: string | null;
  required?: boolean;
};

export class PubgRegistrationFieldService extends RepoService<PubgRegistrationField> {
  constructor() {
    super(PubgRegistrationField);
  }

  async createPubgRegistrationField(data: CreatePubgRegistrationFieldParams) {
    return await super.create({
      tournament: { id: data.tournamentId } as any,
      label: data.label,
      type: data.type as "string" | "number" | "boolean" | "select",
      options: data.options ?? null,
      required: data.required ?? true,
    });
  }

  async findByTournamentId(tournamentId: number) {
    return await this.findManyByCondition({ tournament: { id: tournamentId } } as any);
  }

  async deleteByTournamentId(tournamentId: number) {
    const fields = await this.findByTournamentId(tournamentId);
    if (fields.length > 0) {
      await this.remove(fields);
    }
  }
}
