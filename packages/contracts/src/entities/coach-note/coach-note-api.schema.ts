import { z } from "zod";

import { coachNoteSchema, createCoachNoteSchema, updateCoachNoteSchema } from "./coach-note.schema";

export const getCoachNotesResponseSchema = z.array(coachNoteSchema);

export const getCoachNoteByIdParamsSchema = z.object({
  noteId: z.string().cuid(),
});

export const createCoachNoteRequestSchema = createCoachNoteSchema;
export const createCoachNoteResponseSchema = coachNoteSchema;

export const updateCoachNoteParamsSchema = z.object({
  noteId: z.string().cuid(),
});
export const updateCoachNoteRequestSchema = updateCoachNoteSchema;
export const updateCoachNoteResponseSchema = coachNoteSchema;

export const deleteCoachNoteParamsSchema = z.object({
  noteId: z.string().cuid(),
});
