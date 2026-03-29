import * as yup from "yup";

export const searchUsersQuerySchema = yup.object({
  gamer_name: yup.string().optional(),
  exclude_friends: yup
    .boolean()
    .transform((v) => {
      if (v === "true" || v === true) return true;
      if (v === "false" || v === false) return false;
      return undefined;
    })
    .optional(),
  page: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).optional().default(1),
  limit: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).max(100).optional().default(10),
});

export type SearchUsersQueryDto = yup.InferType<typeof searchUsersQuerySchema>;
