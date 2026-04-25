import { type ExerciseStatus } from "@repo/contracts/library/exercise";
import { type SchemeKind } from "@repo/contracts/library/scheme";
import {
  type Prescription,
  type SchemeConfig,
  type SchemeSectionKind,
  type WorkoutRepScheme,
} from "@repo/contracts/lms/workout-block";

export type LibraryLookupEntry = {
  id: string;
  status: ExerciseStatus;
  createdByUserId: string;
};

export type LibraryLookup = {
  exerciseIds: Set<string>;
  exercisesById: Map<string, LibraryLookupEntry>;
  schemeIds: Set<string>;
  blockTypeIds: Set<string>;
};

export type WorkoutBlockExerciseInput = {
  exerciseId: string;
  repScheme: WorkoutRepScheme;
  repValues: number[];
  sets: number | null;
  prescription: Prescription | null;
  restSec: number | null;
  note: string | null;
  complexGroup: string | null;
  complexOrder: number | null;
  sortOrder: number;
};

export type EmomSlotInput = {
  minuteInRound: number;
  sortOrder: number;
  note: string | null;
  exercises: WorkoutBlockExerciseInput[];
};

export type SchemeSectionInput = {
  kind: SchemeSectionKind;
  schemeId: string | null;
  schemeKind: SchemeKind | null;
  schemeConfig: SchemeConfig | null;
  effortPct: number | null;
  pace: string | null;
  note: string | null;
  tone: string | null;
  sortOrder: number;
  exercises: WorkoutBlockExerciseInput[];
  emomSlots: EmomSlotInput[];
};

export type WorkoutBlockInput = {
  blockTypeId: string;
  title: string | null;
  sortOrder: number;
  sections: SchemeSectionInput[];
};

export type WorkoutTreeInput = {
  blocks: WorkoutBlockInput[];
};

export type ParseWorkoutDocOptions = {
  savingCoachUserId: string;
  strict?: boolean;
};
