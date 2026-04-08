import * as yup from "yup";

export const getMessagesQuerySchema = yup.object({
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
    .default(50),
});

export type GetMessagesQueryDto = yup.InferType<typeof getMessagesQuerySchema>;
