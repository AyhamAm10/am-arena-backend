import * as yup from "yup";

export const updateAchievementSchema = yup.object({
  name: yup.string().optional(),
  description: yup.string().optional(),
  color_theme: yup.string().optional().nullable(),
  icon_url: yup.string().optional().nullable(),
  xp_reward: yup.number().min(0).optional(),
});

export type UpdateAchievementDto = yup.InferType<typeof updateAchievementSchema>;
