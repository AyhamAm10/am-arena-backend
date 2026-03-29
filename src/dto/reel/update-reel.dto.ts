import * as yup from "yup";

export const updateReelSchema = yup.object({
  title: yup.string().min(1, "Title cannot be empty").optional(),
  description: yup.string().min(1, "Description cannot be empty").optional(),
  video_url: yup.string().optional(),
});

export type UpdateReelDto = yup.InferType<typeof updateReelSchema>;
