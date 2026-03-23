import * as yup from "yup";

export const getHeroContentQuerySchema = yup.object({
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

export type GetHeroContentQueryDto = yup.InferType<typeof getHeroContentQuerySchema>;
