import * as yup from "yup";

export const acceptFriendRequestSchema = yup.object({
  user_id: yup.number().required("user_id is required").integer().min(1),
});

export type AcceptFriendRequestDto = yup.InferType<typeof acceptFriendRequestSchema>;
