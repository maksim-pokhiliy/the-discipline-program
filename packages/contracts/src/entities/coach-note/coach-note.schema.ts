import { z } from "zod";

export const coachNoteSchema = z.object({
  id: z.string().cuid(),
  coachId: z.string().cuid(),
  athleteId: z.string().cuid(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCoachNoteSchema = z.object({
  athleteId: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

export const updateCoachNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});
