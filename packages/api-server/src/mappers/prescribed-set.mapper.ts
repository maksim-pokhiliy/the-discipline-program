import { type PrescribedSet as PrismaPrescribedSet } from "@prisma/client";

import { type PrescribedSet, type WeightUnit } from "@repo/contracts/prescribed-set";

export const mapToPrescribedSet = (s: PrismaPrescribedSet): PrescribedSet => ({
  id: s.id,
  blockId: s.blockId,
  exerciseId: s.exerciseId,
  sets: s.sets,
  reps: s.reps,
  weightValue: s.weightValue ? Number(s.weightValue) : null,
  weightUnit: s.weightUnit as WeightUnit,
  rpe: s.rpe,
  notes: s.notes,
});
