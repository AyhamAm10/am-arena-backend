import * as yup from "yup";

export const createAdminMessageSchema = yup.object({
  content: yup.string().required().min(1),
});

export type CreateAdminMessageDto = yup.InferType<typeof createAdminMessageSchema>;
