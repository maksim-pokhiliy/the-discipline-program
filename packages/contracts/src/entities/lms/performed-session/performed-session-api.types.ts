import { type z } from "zod";

import {
  type createPerformedSessionRequestSchema,
  type createPerformedSessionResponseSchema,
} from "./performed-session-api.schema";

export type CreatePerformedSessionRequest = z.infer<typeof createPerformedSessionRequestSchema>;
export type CreatePerformedSessionResponse = z.infer<typeof createPerformedSessionResponseSchema>;
