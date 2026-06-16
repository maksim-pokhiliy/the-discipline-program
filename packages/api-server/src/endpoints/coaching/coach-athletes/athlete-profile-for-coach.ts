import { type AthleteProfile, HealthStatus } from "@repo/contracts/coaching/athlete-profile";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToAthleteProfile } from "../../../mappers/coaching";

const buildDefaultProfile = (athleteUserId: string): AthleteProfile => ({
  id: athleteUserId,
  userId: athleteUserId,
  gender: null,
  heightCm: null,
  weightKg: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export const getAthleteProfile = async (
  coachUserId: string,
  athleteUserId: string,
): Promise<AthleteProfile> => {
  const coachId = await resolveCoachId(coachUserId);

  await verifyAthleteBelongsToCoach(athleteUserId, coachId);

  const profile = await prisma.athleteProfile.findUnique({ where: { userId: athleteUserId } });

  if (!profile) {
    return buildDefaultProfile(athleteUserId);
  }

  return mapToAthleteProfile(profile);
};
