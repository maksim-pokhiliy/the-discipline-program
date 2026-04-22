import { type z } from "zod";

import {
  type createCoachInviteRequestSchema,
  type createCoachInviteResponseSchema,
  type resendCoachInviteParamsSchema,
  type resendCoachInviteResponseSchema,
} from "./coach-invite-api.schema";

export type CreateCoachInviteRequest = z.infer<typeof createCoachInviteRequestSchema>;
export type CreateCoachInviteResponse = z.infer<typeof createCoachInviteResponseSchema>;
export type ResendCoachInviteParams = z.infer<typeof resendCoachInviteParamsSchema>;
export type ResendCoachInviteResponse = z.infer<typeof resendCoachInviteResponseSchema>;
