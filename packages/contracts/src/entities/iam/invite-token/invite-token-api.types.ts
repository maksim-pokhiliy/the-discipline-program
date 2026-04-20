import { type z } from "zod";

import {
  type consumeInviteParamsSchema,
  type consumeInviteRequestSchema,
  type consumeInviteResponseSchema,
  type resendInviteParamsSchema,
  type resendInviteResponseSchema,
  type validateInviteParamsSchema,
  type validateInviteResponseSchema,
} from "./invite-token-api.schema";

export type ValidateInviteParams = z.infer<typeof validateInviteParamsSchema>;
export type ValidateInviteResponse = z.infer<typeof validateInviteResponseSchema>;
export type ConsumeInviteParams = z.infer<typeof consumeInviteParamsSchema>;
export type ConsumeInviteRequest = z.infer<typeof consumeInviteRequestSchema>;
export type ConsumeInviteResponse = z.infer<typeof consumeInviteResponseSchema>;
export type ResendInviteParams = z.infer<typeof resendInviteParamsSchema>;
export type ResendInviteResponse = z.infer<typeof resendInviteResponseSchema>;
