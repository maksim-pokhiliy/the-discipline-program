import { type AthleteMax as PrismaAthleteMax } from "@prisma/client";

import { type AthleteMax } from "@repo/contracts/athlete-max";

import { UNIT_MAP } from "./enum-maps";

export const mapToAthleteMax = (m: PrismaAthleteMax): AthleteMax => ({
  id: m.id,
  userId: m.userId,
  exerciseId: m.exerciseId,
  value: Number(m.value),
  unit: UNIT_MAP[m.unit],
  testedAt: m.testedAt,
  createdAt: m.createdAt,
});
