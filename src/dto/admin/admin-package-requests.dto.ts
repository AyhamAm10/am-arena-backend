import * as yup from "yup";

export const getAdminPackageRequestsQuerySchema = yup.object({
  status: yup
    .string()
    .oneOf(["pending", "approved", "rejected"])
    .optional(),
  search: yup.string().optional().default(""),
  page: yup
    .number()
    .transform((value) => (value ? Number(value) : undefined))
    .min(1)
    .optional()
    .default(1),
  limit: yup
    .number()
    .transform((value) => (value ? Number(value) : undefined))
    .min(1)
    .max(100)
    .optional()
    .default(25),
});

export const adminPaymentIdParamsSchema = yup.object({
  id: yup.number().required(),
});

export const approvePackageRequestSchema = yup.object({
  note: yup.string().optional().nullable(),
});

export const rejectPackageRequestSchema = yup.object({
  note: yup.string().optional().nullable(),
});

export type GetAdminPackageRequestsQueryDto = yup.InferType<
  typeof getAdminPackageRequestsQuerySchema
>;
export type AdminPaymentIdParamsDto = yup.InferType<
  typeof adminPaymentIdParamsSchema
>;
export type ApprovePackageRequestDto = yup.InferType<
  typeof approvePackageRequestSchema
>;
export type RejectPackageRequestDto = yup.InferType<
  typeof rejectPackageRequestSchema
>;
