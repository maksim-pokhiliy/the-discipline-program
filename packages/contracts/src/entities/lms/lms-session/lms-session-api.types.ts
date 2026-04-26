import { type z } from "zod";

import {
  type createLmsSessionInputSchema,
  type createLmsSessionResponseSchema,
  type getLmsSessionResponseSchema,
  type lmsSessionIdParamSchema,
  type updateLmsSessionInputSchema,
  type updateLmsSessionResponseSchema,
} from "./lms-session-api.schema";

export type CreateLmsSessionInput = z.infer<typeof createLmsSessionInputSchema>;
export type UpdateLmsSessionInput = z.infer<typeof updateLmsSessionInputSchema>;
export type LmsSessionIdParam = z.infer<typeof lmsSessionIdParamSchema>;
export type GetLmsSessionResponse = z.infer<typeof getLmsSessionResponseSchema>;
export type CreateLmsSessionResponse = z.infer<typeof createLmsSessionResponseSchema>;
export type UpdateLmsSessionResponse = z.infer<typeof updateLmsSessionResponseSchema>;
