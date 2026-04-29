import * as yup from "yup";

export const assignSurvivorsSchema = yup.object({
  user_ids: yup
    .array()
    .of(yup.number().positive().integer().required())
    .min(1, "At least one survivor is required")
    .max(5, "A maximum of five survivors is allowed")
    .required(),
});

export type AssignSurvivorsDto = yup.InferType<typeof assignSurvivorsSchema>;

