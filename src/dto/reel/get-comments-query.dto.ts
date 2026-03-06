import * as yup from "yup";

export const getCommentsQuerySchema = yup.object({
  page: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).optional().default(1),
  limit: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).max(100).optional().default(10),
});

export type GetCommentsQueryDto = yup.InferType<typeof getCommentsQuerySchema>;
