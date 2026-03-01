import * as yup from "yup";

export const authLoginSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export type AuthLoginDto = yup.InferType<typeof authLoginSchema>;
