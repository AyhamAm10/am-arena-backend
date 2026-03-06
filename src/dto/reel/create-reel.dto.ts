import * as yup from "yup";

export const createReelSchema = yup.object({
  title: yup.string().required("Title is required"),
  video_url: yup.string().required("video_url is required"),
  description: yup.string().required("Description is required"),
});

export type CreateReelDto = yup.InferType<typeof createReelSchema>;
