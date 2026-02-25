import { type z } from "zod";

import {
  type createCoachNoteRequestSchema,
  type createCoachNoteResponseSchema,
  type deleteCoachNoteParamsSchema,
  type getCoachNoteByIdParamsSchema,
  type getCoachNotesResponseSchema,
  type updateCoachNoteParamsSchema,
  type updateCoachNoteRequestSchema,
  type updateCoachNoteResponseSchema,
} from "./coach-note-api.schema";

export type GetCoachNotesResponse = z.infer<typeof getCoachNotesResponseSchema>;
export type GetCoachNoteByIdParams = z.infer<typeof getCoachNoteByIdParamsSchema>;
export type CreateCoachNoteRequest = z.infer<typeof createCoachNoteRequestSchema>;
export type CreateCoachNoteResponse = z.infer<typeof createCoachNoteResponseSchema>;
export type UpdateCoachNoteParams = z.infer<typeof updateCoachNoteParamsSchema>;
export type UpdateCoachNoteRequest = z.infer<typeof updateCoachNoteRequestSchema>;
export type UpdateCoachNoteResponse = z.infer<typeof updateCoachNoteResponseSchema>;
export type DeleteCoachNoteParams = z.infer<typeof deleteCoachNoteParamsSchema>;
