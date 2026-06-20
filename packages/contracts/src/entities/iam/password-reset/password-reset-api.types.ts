import { type z } from "zod";

import {
  type consumePasswordResetParamsSchema,
  type consumePasswordResetRequestSchema,
  type consumePasswordResetResponseSchema,
  type requestPasswordResetRequestSchema,
  type requestPasswordResetResponseSchema,
  type validatePasswordResetParamsSchema,
  type validatePasswordResetResponseSchema,
} from "./password-reset-api.schema";

export type RequestPasswordResetRequest = z.infer<typeof requestPasswordResetRequestSchema>;
export type RequestPasswordResetResponse = z.infer<typeof requestPasswordResetResponseSchema>;
export type ValidatePasswordResetParams = z.infer<typeof validatePasswordResetParamsSchema>;
export type ValidatePasswordResetResponse = z.infer<typeof validatePasswordResetResponseSchema>;
export type ConsumePasswordResetParams = z.infer<typeof consumePasswordResetParamsSchema>;
export type ConsumePasswordResetRequest = z.infer<typeof consumePasswordResetRequestSchema>;
export type ConsumePasswordResetResponse = z.infer<typeof consumePasswordResetResponseSchema>;
