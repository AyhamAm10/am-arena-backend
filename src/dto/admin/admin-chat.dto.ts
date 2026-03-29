import * as yup from "yup";

export const adminIdParamsSchema = yup.object({
  id: yup.number().transform((value) => Number(value)).required(),
});

export const createAdminChannelSchema = yup.object({
  title: yup.string().required(),
  allow_user_messages: yup.boolean().optional().default(true),
  member_ids: yup.array().of(yup.number().required()).optional().default([]),
});

export const updateAdminChannelSchema = yup.object({
  title: yup.string().optional(),
  allow_user_messages: yup.boolean().optional(),
  member_ids: yup.array().of(yup.number().required()).optional(),
});

export type AdminIdParamsDto = yup.InferType<typeof adminIdParamsSchema>;
export type CreateAdminChannelDto = yup.InferType<typeof createAdminChannelSchema>;
export type UpdateAdminChannelDto = yup.InferType<typeof updateAdminChannelSchema>;
