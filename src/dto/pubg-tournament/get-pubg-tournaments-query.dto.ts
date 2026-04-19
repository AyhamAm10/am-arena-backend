import * as yup from "yup";

export const getPubgTournamentsQuerySchema = yup.object({
  page: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).optional().default(1),
  limit: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).max(100).optional().default(10),
  is_active: yup
    .boolean()
    .transform((v) => {
      if (v === "true" || v === true) return true;
      if (v === "false" || v === false) return false;
      return undefined;
    })
    .optional(),
  is_super: yup
    .boolean()
    .transform((v) => {
      if (v === "true" || v === true) return true;
      if (v === "false" || v === false) return false;
      return undefined;
    })
    .optional(),
});

export type GetPubgTournamentsQueryDto = yup.InferType<typeof getPubgTournamentsQuerySchema>;
