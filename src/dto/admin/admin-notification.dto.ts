import * as yup from "yup";

const notificationTypes = ["info", "warning", "success"] as const;

export const createAdminNotificationSchema = yup.object({
  title: yup.string().required(),
  description: yup.string().required(),
  type: yup.string().oneOf(notificationTypes).required(),
});

export type CreateAdminNotificationDto = yup.InferType<typeof createAdminNotificationSchema>;
