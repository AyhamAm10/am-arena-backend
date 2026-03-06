import * as yup from "yup";

export const assignAchievementSchema = yup.object({
  user_id: yup.number().required("user_id is required").integer().min(1),
});

export type AssignAchievementDto = yup.InferType<typeof assignAchievementSchema>;
