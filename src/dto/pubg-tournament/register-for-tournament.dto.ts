import * as yup from "yup";

const fieldValueSchema = yup.object({
  field_id: yup.number().required("Field id is required"),
  value: yup.string().required("Value is required"),
});

export const registerForTournamentSchema = yup.object({
  field_values: yup.array().of(fieldValueSchema).required("Field values are required"),
});

export type RegisterForTournamentDto = yup.InferType<typeof registerForTournamentSchema>;
