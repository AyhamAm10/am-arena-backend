import * as yup from "yup";

export const getBestUsersQuerySchema = yup.object({
  page: yup
    .number()
    .transform((v) => (v ? Number(v) : undefined))
    .min(1)
    .optional()
    .default(1),
  limit: yup
    .number()
    .transform((v) => (v ? Number(v) : undefined))
    .min(1)
    .max(100)
    .optional()
    .default(10),
});

export type GetBestUsersQueryDto = yup.InferType<typeof getBestUsersQuerySchema>;
