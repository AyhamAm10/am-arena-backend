import { PubgRegistrationFieldValue } from "../../../entities/PubgRegistrationFieldValue";
import { RepoService } from "../../repo.service";

type CreatePubgRegistrationFieldValueParams = {
  registrationId: number;
  fieldId: number;
  value: string;
};

export class PubgRegistrationFieldValueService extends RepoService<PubgRegistrationFieldValue> {
  constructor() {
    super(PubgRegistrationFieldValue);
  }

  async create(data: CreatePubgRegistrationFieldValueParams) {
    return await super.create({
      registration: { id: data.registrationId } as any,
      field: { id: data.fieldId } as any,
      value: data.value,
    });
  }

  async findByRegistrationId(registrationId: number) {
    return await this.findManyByCondition({ registration: { id: registrationId } } as any);
  }
}
