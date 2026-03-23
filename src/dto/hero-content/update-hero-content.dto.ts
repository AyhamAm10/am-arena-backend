import * as yup from "yup";

export const updateHeroContentSchema = yup.object({
  image: yup.string().optional(),
  title: yup.string().optional(),
  description: yup.string().optional(),
});

export type UpdateHeroContentDto = yup.InferType<typeof updateHeroContentSchema>;
