import * as yup from "yup";

const friendStatusEnum = ["pending", "accepted", "blocked"] as const;

export const getFriendsQuerySchema = yup.object({
  status: yup.string().oneOf(friendStatusEnum).optional(),
  gamer_name: yup.string().optional(),
  page: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).optional().default(1),
  limit: yup.number().transform((v) => (v ? Number(v) : undefined)).min(1).max(100).optional().default(10),
});

export type GetFriendsQueryDto = yup.InferType<typeof getFriendsQuerySchema>;
