import { type AthleteMax as PrismaAthleteMax } from "@prisma/client";

import { type AthleteMax } from "@repo/contracts/athlete-max";
import { type WeightUnit } from "@repo/contracts/prescribed-set";

export const mapToAthleteMax = (m: PrismaAthleteMax): AthleteMax => ({
  id: m.id,
  userId: m.userId,
  exerciseId: m.exerciseId,
  value: Number(m.value),
  unit: m.unit as WeightUnit,
  testedAt: m.testedAt,
  createdAt: m.createdAt,
});
