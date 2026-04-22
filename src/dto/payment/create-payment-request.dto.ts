import * as yup from "yup";

export const createPaymentRequestSchema = yup.object({
  package_id: yup.number().required(),
  method: yup.string().optional().default("manual"),
  reference: yup.string().optional().nullable(),
});

export type CreatePaymentRequestDto = yup.InferType<
  typeof createPaymentRequestSchema
>;
