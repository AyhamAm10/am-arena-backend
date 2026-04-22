import * as yup from "yup";

export const createManualCoinsSchema = yup.object({
  user_id: yup.number().required(),
  amount: yup.number().integer().min(1).required(),
  note: yup.string().optional().nullable(),
});

export type CreateManualCoinsDto = yup.InferType<typeof createManualCoinsSchema>;
