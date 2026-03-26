import * as yup from "yup";

export const authRefreshSchema = yup.object({
  refreshToken: yup.string().optional(),
});

export type AuthRefreshDto = yup.InferType<typeof authRefreshSchema>;
