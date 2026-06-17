import { type AthleteProfile as PrismaAthleteProfile } from "@prisma/client";

import {
  type AthleteProfile,
  profileSelectionsSchema,
} from "@repo/contracts/coaching/athlete-profile";

import { GENDER_MAP, HEALTH_STATUS_MAP } from "./enum-maps";

export const mapToAthleteProfile = (p: PrismaAthleteProfile): AthleteProfile => ({
  id: p.id,
  userId: p.userId,
  gender: p.gender ? GENDER_MAP[p.gender] : null,
  heightCm: p.heightCm,
  weightKg: p.weightKg ? Number(p.weightKg) : null,
  healthStatus: HEALTH_STATUS_MAP[p.healthStatus],
  healthNote: p.healthNote,
  profileSelections:
    p.profileSelections === null ? null : profileSelectionsSchema.parse(p.profileSelections),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
