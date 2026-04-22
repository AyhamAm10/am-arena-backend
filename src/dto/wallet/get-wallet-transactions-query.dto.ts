import * as yup from "yup";

export const getWalletTransactionsQuerySchema = yup.object({
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
    .max(50)
    .optional()
    .default(15),
});

export type GetWalletTransactionsQueryDto = yup.InferType<
  typeof getWalletTransactionsQuerySchema
>;
