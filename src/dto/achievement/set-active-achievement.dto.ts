import * as yup from "yup";

export const setActiveAchievementSchema = yup.object({
  user_achievement_id: yup.number().integer().min(1).required("user_achievement_id is required"),
});

export type SetActiveAchievementDto = yup.InferType<typeof setActiveAchievementSchema>;
