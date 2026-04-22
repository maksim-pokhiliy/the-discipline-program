import { type z } from "zod";

import {
  type createCoachInviteRequestSchema,
  type createCoachInviteResponseSchema,
} from "./coach-invite-api.schema";

export type CreateCoachInviteRequest = z.infer<typeof createCoachInviteRequestSchema>;
export type CreateCoachInviteResponse = z.infer<typeof createCoachInviteResponseSchema>;
