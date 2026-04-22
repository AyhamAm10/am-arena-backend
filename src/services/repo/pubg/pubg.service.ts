import { PubgGame, PubgType } from "../../../entities/PubgGame";
import { RepoService } from "../../repo.service";
import { DeepPartial } from "typeorm";

type CreatePubgGameParams = {
  image: string;
  image_public_id?: string | null;
  type: PubgType | string;
  map: string;
};

export class PubgService extends RepoService<PubgGame> {
  constructor() {
    super(PubgGame);
  }

  async createPubgGame  (data: CreatePubgGameParams) {
    const type = (typeof data.type === "string" ? data.type : data.type) as PubgType;
    return await super.create({
      type,
      image: data.image,
      image_public_id: data.image_public_id ?? null,
      map: data.map,
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
