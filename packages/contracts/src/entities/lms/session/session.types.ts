import { type z } from "zod";

import {
  type createSessionSchema,
  type reorderSessionsSchema,
  type sessionSchema,
  type updateSessionSchema,
} from "./session.schema";

export type Session = z.infer<typeof sessionSchema>;
export type CreateSessionData = z.infer<typeof createSessionSchema>;
export type UpdateSessionData = z.infer<typeof updateSessionSchema>;
export type ReorderSessionsData = z.infer<typeof reorderSessionsSchema>;
