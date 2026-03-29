import * as yup from "yup";

export const removePendingFriendSchema = yup.object({
  friend_user_id: yup.number().required("friend_user_id is required").integer().min(1),
});

export type RemovePendingFriendDto = yup.InferType<typeof removePendingFriendSchema>;
