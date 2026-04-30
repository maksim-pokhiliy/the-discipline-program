import {
  type ExerciseEntry as PrismaExerciseEntry,
  type SetGroup as PrismaSetGroup,
} from "@prisma/client";

import { restSpecSchema } from "@repo/contracts/lms/_domain";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type SetGroup } from "@repo/contracts/lms/set-group";

import { mapToExerciseEntry } from "./exercise-entry.mapper";

export type SetGroupWithEntriesRow = PrismaSetGroup & { entries: PrismaExerciseEntry[] };

export type SetGroupWithEntries = SetGroup & { entries: ExerciseEntry[] };

export const mapToSetGroup = (s: PrismaSetGroup): SetGroup => ({
  id: s.id,
  segmentId: s.segmentId,
  order: s.order,
  label: s.label,
  restConfig: s.restConfig === null ? null : restSpecSchema.parse(s.restConfig),
});

export const mapToSetGroupWithEntries = (s: SetGroupWithEntriesRow): SetGroupWithEntries => ({
  ...mapToSetGroup(s),
  entries: s.entries.map(mapToExerciseEntry),
});
