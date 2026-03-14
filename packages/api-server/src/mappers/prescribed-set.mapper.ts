import { type PrescribedSet as PrismaPrescribedSet } from "@prisma/client";

import { type PrescribedSet } from "@repo/contracts/prescribed-set";

import { UNIT_MAP, WEIGHT_TYPE_MAP } from "./enum-maps";

export const mapToPrescribedSet = (s: PrismaPrescribedSet): PrescribedSet => ({
  id: s.id,
  blockId: s.blockId,
  exerciseId: s.exerciseId,
  reps: s.reps,
  weightValue: s.weightValue ? Number(s.weightValue) : null,
  weightUnit: UNIT_MAP[s.weightUnit],
  weightType: WEIGHT_TYPE_MAP[s.weightType],
  rpe: s.rpe,
  notes: s.notes,
  sortOrder: s.sortOrder,
});
