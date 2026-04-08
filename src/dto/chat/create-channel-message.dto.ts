import * as yup from "yup";

export const createChannelMessageSchema = yup.object({
  content: yup.string().required().trim().min(1).max(8000),
});

export type CreateChannelMessageDto = yup.InferType<typeof createChannelMessageSchema>;
