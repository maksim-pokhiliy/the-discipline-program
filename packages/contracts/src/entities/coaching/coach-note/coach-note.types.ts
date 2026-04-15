import { type z } from "zod";

import {
  type coachNoteSchema,
  type createCoachNoteSchema,
  type updateCoachNoteSchema,
} from "./coach-note.schema";

export type CoachNote = z.infer<typeof coachNoteSchema>;
export type CreateCoachNoteData = z.infer<typeof createCoachNoteSchema>;
export type UpdateCoachNoteData = z.infer<typeof updateCoachNoteSchema>;
