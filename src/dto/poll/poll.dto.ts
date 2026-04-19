import * as yup from "yup";

const pollTypes = ["tournament", "global", "message"] as const;
const pollOptionTypes = ["text", "user"] as const;
const notificationTargets = ["all", "selected"] as const;

function toNumberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

export const pollIdParamsSchema = yup.object({
  id: yup.number().transform((value) => Number(value)).required(),
});

export const tournamentPollParamsSchema = yup.object({
  tournamentId: yup.number().transform((value) => Number(value)).required(),
});

export const chatPollParamsSchema = yup.object({
  chatId: yup.number().transform((value) => Number(value)).required(),
});

export const createPollOptionSchema = yup.object({
  label: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .nullable()
    .default(null),
  type: yup.string().oneOf(pollOptionTypes).required(),
  user_id: yup
    .number()
    .transform((value) => toNullableNumber(value))
    .nullable()
    .default(null),
});

export const createPollSchema = yup.object({
  title: yup.string().trim().required(),
  description: yup.string().trim().optional().default(""),
  type: yup.string().oneOf(pollTypes).required(),
  tournament_id: yup
    .number()
    .transform((value) => toNullableNumber(value))
    .nullable()
    .default(null),
  chat_id: yup
    .number()
    .transform((value) => toNullableNumber(value))
    .nullable()
    .default(null),
  expires_at: yup
    .string()
    .transform((value) => toNullableString(value))
    .nullable()
    .default(null),
  is_active: yup.boolean().optional().default(true),
  message_content: yup
    .string()
    .transform((value) => toNullableString(value))
    .nullable()
    .default(null),
  options: yup.array().of(createPollOptionSchema).min(2).required(),
});

export const updatePollSchema = yup.object({
  title: yup.string().trim().optional(),
  description: yup.string().trim().optional(),
  expires_at: yup
    .string()
    .transform((value) => toNullableString(value))
    .nullable()
    .optional(),
  is_active: yup.boolean().optional(),
});

export const addPollOptionSchema = createPollOptionSchema;

export const castVoteSchema = yup.object({
  option_id: yup.number().transform((value) => Number(value)).required(),
});

export const listPollsQuerySchema = yup.object({
  page: yup
    .number()
    .transform((value) => toNumberOrUndefined(value))
    .min(1)
    .optional()
    .default(1),
  limit: yup
    .number()
    .transform((value) => toNumberOrUndefined(value))
    .min(1)
    .max(100)
    .optional()
    .default(25),
  type: yup.string().oneOf(pollTypes).optional(),
  is_active: yup.boolean().optional(),
  tournament_id: yup
    .number()
    .transform((value) => toNumberOrUndefined(value))
    .optional(),
  chat_id: yup
    .number()
    .transform((value) => toNumberOrUndefined(value))
    .optional(),
  search: yup.string().trim().optional(),
});

export const pollAnalyticsQuerySchema = yup.object({
  include_voters: yup.boolean().optional().default(false),
});

export const notifyGlobalPollSchema = yup.object({
  target: yup.string().oneOf(notificationTargets).required(),
  user_ids: yup
    .array()
    .of(yup.number().integer().positive())
    .optional()
    .default([]),
});

export type PollIdParamsDto = yup.InferType<typeof pollIdParamsSchema>;
export type TournamentPollParamsDto = yup.InferType<typeof tournamentPollParamsSchema>;
export type ChatPollParamsDto = yup.InferType<typeof chatPollParamsSchema>;
export type CreatePollDto = yup.InferType<typeof createPollSchema>;
export type UpdatePollDto = yup.InferType<typeof updatePollSchema>;
export type AddPollOptionDto = yup.InferType<typeof addPollOptionSchema>;
export type CastVoteDto = yup.InferType<typeof castVoteSchema>;
export type ListPollsQueryDto = yup.InferType<typeof listPollsQuerySchema>;
export type PollAnalyticsQueryDto = yup.InferType<typeof pollAnalyticsQuerySchema>;
export type NotifyGlobalPollDto = yup.InferType<typeof notifyGlobalPollSchema>;
