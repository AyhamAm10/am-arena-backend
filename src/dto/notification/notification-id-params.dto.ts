import * as yup from "yup";

export const notificationIdParamsSchema = yup.object({
  id: yup
    .number()
    .integer()
    .positive()
    .required()
    .transform((val) => parseInt(String(val), 10)),
});

export type NotificationIdParamsDto = yup.InferType<typeof notificationIdParamsSchema>;
