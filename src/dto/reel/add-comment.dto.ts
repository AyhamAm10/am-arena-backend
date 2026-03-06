import * as yup from "yup";

export const addCommentSchema = yup.object({
  comment: yup.string().required("Comment is required"),
});

export type AddCommentDto = yup.InferType<typeof addCommentSchema>;
