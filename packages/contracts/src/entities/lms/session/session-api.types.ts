import { type z } from "zod";

import {
  type createSessionRequestSchema,
  type createSessionResponseSchema,
  type duplicateSessionRequestSchema,
  type duplicateSessionResponseSchema,
  type reorderSessionsRequestSchema,
  type reorderSessionsResponseSchema,
  type sessionByDayParamsSchema,
  type sessionByIdParamsSchema,
  type updateSessionRequestSchema,
  type updateSessionResponseSchema,
} from "./session-api.schema";

export type SessionByDayParams = z.infer<typeof sessionByDayParamsSchema>;
export type SessionByIdParams = z.infer<typeof sessionByIdParamsSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type UpdateSessionRequest = z.infer<typeof updateSessionRequestSchema>;
export type UpdateSessionResponse = z.infer<typeof updateSessionResponseSchema>;
export type ReorderSessionsRequest = z.infer<typeof reorderSessionsRequestSchema>;
export type ReorderSessionsResponse = z.infer<typeof reorderSessionsResponseSchema>;
export type DuplicateSessionRequest = z.infer<typeof duplicateSessionRequestSchema>;
export type DuplicateSessionResponse = z.infer<typeof duplicateSessionResponseSchema>;
