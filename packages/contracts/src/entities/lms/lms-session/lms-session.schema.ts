import { z } from "zod";

import { LMS_SESSION_CONSTANTS } from "./lms-session.constants";

export const lmsSessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(LMS_SESSION_CONSTANTS.MAX_LABEL_LENGTH).nullable(),
  notes: z.string().max(LMS_SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  version: z.number().int().min(1),
});
