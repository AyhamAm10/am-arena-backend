import * as yup from "yup";

export const authRegisterSchema = yup.object({
  full_name: yup.string().required("Full name is required"),
  gamer_name: yup.string().required("Gamer name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  phone: yup.string().optional(),
  profile_picture_url: yup.string().url("Invalid URL format").optional(),
});

export type AuthRegisterDto = yup.InferType<typeof authRegisterSchema>;