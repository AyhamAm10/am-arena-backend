import * as yup from "yup";

export const searchTagUsersQuerySchema = yup.object({
  query: yup.string().trim().min(1).max(64).required("query is required"),
  limit: yup
    .number()
    .transform((v) => (v ? Number(v) : undefined))
    .min(1)
    .max(20)
    .optional()
    .default(10),
});

export type SearchTagUsersQueryDto = yup.InferType<typeof searchTagUsersQuerySchema>;
