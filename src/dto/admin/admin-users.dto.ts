import * as yup from "yup";

export const getAdminUsersQuerySchema = yup.object({
  search: yup.string().optional().default(""),
  page: yup
    .number()
    .transform((value) => (value ? Number(value) : undefined))
    .min(1)
    .optional()
    .default(1),
  limit: yup
    .number()
    .transform((value) => (value ? Number(value) : undefined))
    .min(1)
    .max(100)
    .optional()
    .default(25),
});

export const updateAdminUserStatusSchema = yup.object({
  is_active: yup.boolean().required(),
});

export const updateAdminUserBalanceSchema = yup.object({
  coins_delta: yup.number().optional().default(0),
  xp_delta: yup.number().optional().default(0),
});

export type GetAdminUsersQueryDto = yup.InferType<typeof getAdminUsersQuerySchema>;
export type UpdateAdminUserStatusDto = yup.InferType<typeof updateAdminUserStatusSchema>;
export type UpdateAdminUserBalanceDto = yup.InferType<typeof updateAdminUserBalanceSchema>;
