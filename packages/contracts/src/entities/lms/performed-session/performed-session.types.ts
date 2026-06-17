import { type z } from "zod";

import {
  type createPerformedSessionSchema,
  type performedSessionSchema,
} from "./performed-session.schema";

export type PerformedSession = z.infer<typeof performedSessionSchema>;
export type CreatePerformedSessionData = z.infer<typeof createPerformedSessionSchema>;
