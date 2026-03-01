import { PubgGame, PubgType } from "../../../entities/PubgGame";
import { RepoService } from "../../repo.service";
import { DeepPartial } from "typeorm";

type CreatePubgGameParams = {
  type: PubgType | string;
  map: string;
  max_players: number;
  entry_fee: number;
  prize_pool: number;
};

export class PubgService extends RepoService<PubgGame> {
  constructor() {
    super(PubgGame);
  }

  async createPubgGame  (data: CreatePubgGameParams) {
    const type = (typeof data.type === "string" ? data.type : data.type) as PubgType;
    return await super.create({
      type,
      map: data.map,
      max_players: data.max_players,
      entry_fee: data.entry_fee,
      prize_pool: data.prize_pool,
    });
  }

  async update(id: string | number, data: DeepPartial<PubgGame>) {
    const payload: DeepPartial<PubgGame> = { ...data };
    if (data.type !== undefined && typeof data.type === "string") {
      payload.type = data.type as PubgType;
    }
    return await super.update(id, payload);
  }

  async getById(id: string | number) {
    return await super.getById(id);
  }

  async delete(id: string | number) {
    await super.delete(id);
  }
}
