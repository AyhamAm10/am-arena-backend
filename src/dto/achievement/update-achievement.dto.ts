import * as yup from "yup";
import { AchievementType } from "../../entities/Achievement";

const achievementLogicTypes = ["progress", "event", "manual"] as const;

export const updateAchievementSchema = yup.object({
  name: yup.string().optional(),
  description: yup.string().optional(),
  color_theme: yup.string().optional().nullable(),
  icon_url: yup.string().optional().nullable(),
  xp_reward: yup.number().min(0).optional(),
  type: yup.mixed<AchievementType>().oneOf(Object.values(AchievementType)).optional(),
  logic_type: yup
    .mixed<(typeof achievementLogicTypes)[number]>()
    .oneOf(achievementLogicTypes)
    .optional(),
  target: yup.number().integer().min(1).nullable().optional(),
});

export type UpdateAchievementDto = yup.InferType<typeof updateAchievementSchema>;
