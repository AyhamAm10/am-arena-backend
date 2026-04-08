import * as yup from "yup";

const pubgTypeEnum = ["solo", "duo", "squad"] as const;
const registrationFieldTypeEnum = ["string", "number", "boolean", "select"] as const;

const gameSchema = yup.object({
  type: yup.string().oneOf(pubgTypeEnum).required("Game type is required"),
  map: yup.string().required("Map is required"),
  image: yup.string().optional(),
});

const registrationFieldSchema = yup.object({
  label: yup.string().required("Label is required"),
  type: yup.string().oneOf(registrationFieldTypeEnum).required("Field type is required"),
  options: yup.string().optional().nullable(),
  required: yup.boolean().default(true),
});

export const createPubgTournamentSchema = yup.object({
  game: gameSchema.required("Game data is required"),
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  entry_fee: yup.number().min(0).required("Entry fee is required"),
  prize_pool: yup.number().min(0).required("Prize pool is required"),
  max_players: yup.number().min(1).required("Max players is required"),
  start_date: yup.string().optional().nullable(),
  end_date: yup.string().optional().nullable(),
  is_active: yup.boolean().optional().default(true),
  registration_fields: yup.array().of(registrationFieldSchema).optional().default([]),
  notify_all_users: yup.boolean().optional().default(false),
});

export type CreatePubgTournamentDto = yup.InferType<typeof createPubgTournamentSchema>;
