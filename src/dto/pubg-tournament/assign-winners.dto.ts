import * as yup from "yup";

export const assignWinnersSchema = yup.object({
  user_ids: yup
    .array()
    .of(yup.number().positive().integer().required())
    .min(1, "At least one winner is required")
    .required(),
});

export type AssignWinnersDto = yup.InferType<typeof assignWinnersSchema>;
