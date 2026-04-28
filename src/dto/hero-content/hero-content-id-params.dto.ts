import * as yup from "yup";

export const heroContentIdParamsSchema = yup.object({
  id: yup
    .number()
    .required()
    .transform((value, originalValue) => {
      if (typeof originalValue === "string") {
        const trimmed = originalValue.trim();
        return /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : NaN;
      }
      return value;
    })
    .integer()
    .positive(),
});

export type HeroContentIdParamsDto = yup.InferType<typeof heroContentIdParamsSchema>;
