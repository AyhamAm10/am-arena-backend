import * as yup from "yup";

export const updateReelSchema = yup.object({
  title: yup.string().min(1, "Title cannot be empty").optional(),
  description: yup.string().min(1, "Description cannot be empty").optional(),
  video_url: yup.string().optional(),
  mentioned_user_ids: yup.array().of(yup.number().integer().min(1)).optional(),
});

export type UpdateReelDto = yup.InferType<typeof updateReelSchema>;
