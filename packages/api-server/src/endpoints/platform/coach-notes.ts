import {
  type CoachNote,
  type CreateCoachNoteData,
  type UpdateCoachNoteData,
} from "@repo/contracts/coach-note";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToCoachNote } from "../../mappers";

import { resolveCoachId } from "./guards";

export const platformCoachNotesApi = {
  getAll: async (userId: string): Promise<CoachNote[]> => {
    const coachId = await resolveCoachId(userId);

    const notes = await prisma.coachNote.findMany({
      where: { coachId },
      orderBy: { createdAt: "desc" },
    });

    return notes.map(mapToCoachNote);
  },

  getById: async (userId: string, noteId: string): Promise<CoachNote> => {
    const coachId = await resolveCoachId(userId);

    const note = await prisma.coachNote.findUnique({ where: { id: noteId } });

    if (!note || note.coachId !== coachId) {
      throw new NotFoundError("Coach note not found", { noteId });
    }

    return mapToCoachNote(note);
  },

  create: async (userId: string, data: CreateCoachNoteData): Promise<CoachNote> => {
    const coachId = await resolveCoachId(userId);

    const athlete = await prisma.user.findUnique({
      where: { id: data.athleteId },
      select: { id: true },
    });

    if (!athlete) {
      throw new NotFoundError("Athlete not found", { athleteId: data.athleteId });
    }

    const note = await prisma.coachNote.create({
      data: { coachId, ...data },
    });

    return mapToCoachNote(note);
  },

  update: async (userId: string, noteId: string, data: UpdateCoachNoteData): Promise<CoachNote> => {
    const coachId = await resolveCoachId(userId);

    const existing = await prisma.coachNote.findUnique({ where: { id: noteId } });

    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError("Coach note not found", { noteId });
    }

    const note = await prisma.coachNote.update({
      where: { id: noteId },
      data,
    });

    return mapToCoachNote(note);
  },

  delete: async (userId: string, noteId: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    const existing = await prisma.coachNote.findUnique({ where: { id: noteId } });

    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError("Coach note not found", { noteId });
    }

    await prisma.coachNote.delete({ where: { id: noteId } });
  },
};
