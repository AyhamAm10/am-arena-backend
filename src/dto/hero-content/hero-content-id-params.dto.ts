import * as yup from "yup";

export const heroContentIdParamsSchema = yup.object({
  id: yup
    .string()
    .required()
    .matches(/^\d+$/)
    .transform((val) => parseInt(val, 10)),
});

export type HeroContentIdParamsDto = yup.InferType<typeof heroContentIdParamsSchema>;
