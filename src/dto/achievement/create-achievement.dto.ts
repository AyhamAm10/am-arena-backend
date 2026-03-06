import * as yup from "yup";

export const createAchievementSchema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().required("Description is required"),
  color_theme: yup.string().optional().nullable(),
  icon_url: yup.string().optional().nullable(),
  xp_reward: yup.number().min(0).required("xp_reward is required"),
});

export type CreateAchievementDto = yup.InferType<typeof createAchievementSchema>;
