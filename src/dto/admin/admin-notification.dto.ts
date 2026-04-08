import * as yup from "yup";

const notificationTypes = ["info", "warning", "success"] as const;

export const createAdminNotificationSchema = yup.object({
  title: yup.string().required(),
  description: yup.string().required(),
  type: yup.string().oneOf(notificationTypes).required(),
  route: yup.string().optional().default(""),
  action_label: yup.string().optional().default(""),
  user_ids: yup
    .array()
    .of(yup.number().integer().positive())
    .min(1, "Select at least one user")
    .required(),
});

export type CreateAdminNotificationDto = yup.InferType<typeof createAdminNotificationSchema>;
