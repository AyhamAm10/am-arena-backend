import * as yup from "yup";

export const notificationListQuerySchema = yup.object({
  page: yup
    .number()
    .transform((v) => (v != null && v !== "" ? Number(v) : 1))
    .integer()
    .min(1)
    .default(1),
  limit: yup
    .number()
    .transform((v) => (v != null && v !== "" ? Number(v) : 20))
    .integer()
    .min(1)
    .max(100)
    .default(20),
});

export type NotificationListQueryDto = yup.InferType<typeof notificationListQuerySchema>;
