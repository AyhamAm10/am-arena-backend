import * as yup from "yup";

export const createPackageSchema = yup.object({
  name: yup.string().required(),
  price: yup.number().min(0).required(),
  coins: yup.number().integer().min(1).required(),
  is_active: yup.boolean().optional().default(true),
});

export type CreatePackageDto = yup.InferType<typeof createPackageSchema>;
