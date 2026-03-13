"use client";

import type {
  CoachNote,
  CreateCoachNoteData,
  GetCoachNotesResponse,
  UpdateCoachNoteData,
} from "@repo/contracts/coach-note";
import { createCrudHooks, platformKeys } from "@repo/query";

import { api } from "../api";

const coachNoteHooks = createCrudHooks<
  GetCoachNotesResponse,
  CoachNote,
  CreateCoachNoteData,
  UpdateCoachNoteData
>({
  entityName: "Coach Note",
  keys: platformKeys.coachNotes,
  api: {
    getPageData: api.coachNotes.getAll,
    getById: api.coachNotes.getById,
    create: api.coachNotes.create,
    update: api.coachNotes.update,
    delete: api.coachNotes.delete,
  },
  redirectTo: "/coach",
});

export const useCoachNotesPageData = coachNoteHooks.usePageData;
export const useCoachNote = coachNoteHooks.useById;
export const useCreateCoachNote = coachNoteHooks.useCreate;
export const useDeleteCoachNote = coachNoteHooks.useDelete;
