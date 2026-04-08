import * as yup from "yup";

export const notificationPushTokenSchema = yup.object({
  expo_push_token: yup.string().required().min(10),
});

export type NotificationPushTokenDto = yup.InferType<typeof notificationPushTokenSchema>;
