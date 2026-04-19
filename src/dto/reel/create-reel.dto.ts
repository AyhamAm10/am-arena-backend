import * as yup from "yup";

export const createReelSchema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  video_url: yup.string().optional(),
  mentioned_user_ids: yup.array().of(yup.number().integer().min(1)).optional().default([]),
});

export type CreateReelDto = yup.InferType<typeof createReelSchema>;
