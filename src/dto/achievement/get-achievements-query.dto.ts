import * as yup from "yup";

export const getAchievementsQuerySchema = yup.object({
  name: yup.string().optional(),
  user_id: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).optional(),
  page: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).optional().default(1),
  limit: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).max(100).optional().default(10),
});

export type GetAchievementsQueryDto = yup.InferType<typeof getAchievementsQuerySchema>;
