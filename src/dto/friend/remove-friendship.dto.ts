import * as yup from "yup";

export const removeFriendshipSchema = yup.object({
  friend_user_id: yup.number().required("friend_user_id is required").integer().min(1),
});

export type RemoveFriendshipDto = yup.InferType<typeof removeFriendshipSchema>;
