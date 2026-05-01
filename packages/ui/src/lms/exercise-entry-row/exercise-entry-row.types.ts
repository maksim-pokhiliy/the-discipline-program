import { type ChangeEvent, type KeyboardEvent, type RefCallback } from "react";

import { type z } from "zod";

import { type Prescription } from "@repo/contracts/lms/_domain";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

import { type EditSessionStatus } from "../../edit-session";

export type ExerciseEntryRowMode = "edit" | "read";

export type ExerciseEntryRowErrors = z.ZodError | null;

export type ExerciseEntryRowNotesSlotProps = {
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  onChange?: ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined;
  onBlur?: (() => void) | undefined;
  inputRef?: RefCallback<HTMLInputElement | HTMLTextAreaElement> | undefined;
};

export type ExerciseEntryRowProps = {
  entry: ExerciseEntry;
  mode?: ExerciseEntryRowMode | undefined;
  exerciseLibrary?: ExerciseLibraryItem[] | undefined;
  onChange: (next: ExerciseEntry | ((prev: ExerciseEntry) => ExerciseEntry)) => void;
  onPrescriptionChange?: ((next: Prescription) => void) | undefined;
  errors?: ExerciseEntryRowErrors | undefined;
  status?: EditSessionStatus | undefined;
  disabled?: boolean | undefined;
  notesSlotProps?: ExerciseEntryRowNotesSlotProps | undefined;
};
