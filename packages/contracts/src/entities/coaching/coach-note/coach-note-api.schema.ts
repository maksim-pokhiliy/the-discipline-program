import { z } from "zod";

import { coachNoteSchema, createCoachNoteSchema, updateCoachNoteSchema } from "./coach-note.schema";

const noteIdParamSchema = z.object({ noteId: z.string().cuid() });

export const getCoachNotesQuerySchema = z.object({ athleteId: z.string().cuid().optional() });

export const getCoachNotesResponseSchema = z.array(coachNoteSchema);

export const getCoachNoteByIdParamsSchema = noteIdParamSchema;

export const getCoachNoteByIdResponseSchema = coachNoteSchema;

export const createCoachNoteRequestSchema = createCoachNoteSchema;
export const createCoachNoteResponseSchema = coachNoteSchema;

export const updateCoachNoteParamsSchema = noteIdParamSchema;
export const updateCoachNoteRequestSchema = updateCoachNoteSchema;
export const updateCoachNoteResponseSchema = coachNoteSchema;

export const deleteCoachNoteParamsSchema = noteIdParamSchema;
