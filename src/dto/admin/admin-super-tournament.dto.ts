import * as yup from "yup";

const pubgTypeEnum = ["solo", "duo", "squad"] as const;
const registrationFieldTypeEnum = ["string", "number", "boolean", "select"] as const;

const gameSchema = yup.object({
  type: yup.string().oneOf(pubgTypeEnum).required(),
  map: yup.string().required(),
  image: yup.string().optional().default(""),
  image_public_id: yup.string().optional().nullable(),
});

const partialGameSchema = yup.object({
  type: yup.string().oneOf(pubgTypeEnum).optional(),
  map: yup.string().optional(),
  image: yup.string().optional(),
  image_public_id: yup.string().optional().nullable(),
});

const registrationFieldSchema = yup.object({
  label: yup.string().required(),
  type: yup.string().oneOf(registrationFieldTypeEnum).required(),
  options: yup.string().optional().nullable(),
  required: yup.boolean().optional().default(true),
});

const partialRegistrationFieldSchema = yup.object({
  label: yup.string().optional(),
  type: yup.string().oneOf(registrationFieldTypeEnum).optional(),
  options: yup.string().optional().nullable(),
  required: yup.boolean().optional(),
});

export const createSuperTournamentSchema = yup.object({
  game: gameSchema.required(),
  title: yup.string().required(),
  description: yup.string().required(),
  entry_fee: yup.number().min(0).required(),
  prize_pool: yup.number().min(0).required(),
  max_players: yup.number().min(1).required(),
  min_xp_required: yup.number().min(0).required(),
  required_level: yup.number().min(1).optional(),
  start_date: yup.string().optional().nullable(),
  end_date: yup.string().optional().nullable(),
  is_active: yup.boolean().optional().default(true),
  registration_fields: yup.array().of(registrationFieldSchema).optional().default([]),
  notify_all_users: yup.boolean().optional().default(false),
});

export const updateSuperTournamentSchema = yup.object({
  game: partialGameSchema.optional(),
  title: yup.string().optional(),
  description: yup.string().optional(),
  entry_fee: yup.number().min(0).optional(),
  prize_pool: yup.number().min(0).optional(),
  max_players: yup.number().min(1).optional(),
  min_xp_required: yup.number().min(0).optional(),
  required_level: yup.number().min(1).optional(),
  start_date: yup.string().optional().nullable(),
  end_date: yup.string().optional().nullable(),
  is_active: yup.boolean().optional(),
  registration_fields: yup.array().of(partialRegistrationFieldSchema).optional(),
});

export type CreateSuperTournamentDto = yup.InferType<typeof createSuperTournamentSchema>;
export type UpdateSuperTournamentDto = yup.InferType<typeof updateSuperTournamentSchema>;
