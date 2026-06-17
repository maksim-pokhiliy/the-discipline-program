import { z } from "zod";

import { PERFORMED_SESSION_CONSTANTS } from "./performed-session.constants";

export const performedSessionSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  userId: z.string().cuid(),
  performedAt: z.coerce.date(),
  coachNotes: z.string().nullable(),
  athleteNotes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPerformedSessionSchema = z.object({
  sessionId: z.string().cuid(),
  performedAt: z.coerce.date(),
  athleteNotes: z.string().max(PERFORMED_SESSION_CONSTANTS.MAX_NOTE_LENGTH).nullable().optional(),
});
