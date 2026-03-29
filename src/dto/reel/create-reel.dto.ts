import * as yup from "yup";

export const createReelSchema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  video_url: yup.string().optional(),
});

export type CreateReelDto = yup.InferType<typeof createReelSchema>;
