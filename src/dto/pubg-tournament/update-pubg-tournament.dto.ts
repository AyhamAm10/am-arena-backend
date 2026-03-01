import * as yup from "yup";

const pubgTypeEnum = ["solo", "duo", "squad"] as const;
const registrationFieldTypeEnum = ["string", "number", "boolean", "select"] as const;

const gameSchema = yup.object({
  type: yup.string().oneOf(pubgTypeEnum).optional(),
  map: yup.string().optional(),
  max_players: yup.number().min(1).optional(),
  entry_fee: yup.number().min(0).optional(),
  prize_pool: yup.number().min(0).optional(),
});

const registrationFieldSchema = yup.object({
  label: yup.string().optional(),
  type: yup.string().oneOf(registrationFieldTypeEnum).optional(),
  options: yup.string().optional().nullable(),
  required: yup.boolean().optional(),
});

export const updatePubgTournamentSchema = yup.object({
  game: gameSchema.optional(),
  title: yup.string().optional(),
  description: yup.string().optional(),
  type: yup.string().optional(),
  entry_fee: yup.number().min(0).optional(),
  prize_pool: yup.number().min(0).optional(),
  max_players: yup.number().min(1).optional(),
  start_date: yup.string().optional(),
  end_date: yup.string().optional(),
  is_active: yup.boolean().optional(),
  registration_fields: yup.array().of(registrationFieldSchema).optional(),
});

export type UpdatePubgTournamentDto = yup.InferType<typeof updatePubgTournamentSchema>;
