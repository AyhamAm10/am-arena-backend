import * as yup from "yup";

export const addCommentSchema = yup.object({
  comment: yup.string().required("Comment is required"),
  mentioned_user_ids: yup
    .array()
    .of(yup.number().integer().min(1))
    .optional()
    .default([]),
});

export type AddCommentDto = yup.InferType<typeof addCommentSchema>;
