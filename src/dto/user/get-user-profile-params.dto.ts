import * as yup from "yup";

export const getUserProfileParamsSchema = yup.object({
  id: yup
    .number()
    .required()
    .transform((val) => parseInt(val, 10)),
});

export type GetUserProfileParamsDto = yup.InferType<typeof getUserProfileParamsSchema>;
