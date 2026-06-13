import { z } from "zod";

export const NOTE_MAX_LENGTH = 2000;
export const NOTES_MAX_COUNT = 50;

export const notesListSchema = z
  .array(z.string().trim().min(1).max(NOTE_MAX_LENGTH))
  .max(NOTES_MAX_COUNT);

export type NotesList = z.infer<typeof notesListSchema>;
