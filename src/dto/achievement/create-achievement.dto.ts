import * as yup from "yup";
import { AchievementType } from "../../entities/Achievement";

const achievementLogicTypes = ["progress", "event", "manual"] as const;

export const createAchievementSchema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().required("Description is required"),
  color_theme: yup.string().optional().nullable(),
  icon_url: yup.string().optional().nullable(),
  xp_reward: yup.number().min(0).required("xp_reward is required"),
  type: yup
    .mixed<AchievementType>()
    .oneOf(Object.values(AchievementType))
    .required("type is required"),
  logic_type: yup
    .mixed<(typeof achievementLogicTypes)[number]>()
    .oneOf(achievementLogicTypes)
    .required("logic_type is required"),
  target: yup.number().integer().min(1).nullable().optional(),
});

export type CreateAchievementDto = yup.InferType<typeof createAchievementSchema>;
