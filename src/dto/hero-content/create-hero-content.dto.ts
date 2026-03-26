import * as yup from "yup";

export const createHeroContentSchema = yup.object({
  title: yup.string().required(),
  description: yup.string().required(),
});

export type CreateHeroContentDto = yup.InferType<typeof createHeroContentSchema>;
