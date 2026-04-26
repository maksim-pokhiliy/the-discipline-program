import { type z } from "zod";

import { type Prescription } from "@repo/contracts/lms/_domain";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

import { type EditSessionStatus } from "../../edit-session";

export type ExerciseEntryRowMode = "edit" | "read";

export type ExerciseEntryRowErrors = z.ZodError | null;

export type ExerciseEntryRowProps = {
  entry: ExerciseEntry;
  mode?: ExerciseEntryRowMode;
  exerciseLibrary?: ExerciseLibraryItem[];
  onChange: (next: ExerciseEntry | ((prev: ExerciseEntry) => ExerciseEntry)) => void;
  onPrescriptionChange?: (next: Prescription) => void;
  errors?: ExerciseEntryRowErrors;
  status?: EditSessionStatus;
  disabled?: boolean;
};
