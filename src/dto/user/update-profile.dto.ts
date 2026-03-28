import * as yup from "yup";

export const profileUpdateSchema = yup.object({
  full_name: yup.string().optional(),
  gamer_name: yup.string().optional(),
  email: yup.string().email("Invalid email format").optional(),
  phone: yup.string().optional(),
});

export type ProfileUpdateDto = yup.InferType<typeof profileUpdateSchema>;