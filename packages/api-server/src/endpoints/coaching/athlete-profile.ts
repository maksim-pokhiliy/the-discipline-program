import {
  type AthleteProfile,
  type UpdateAthleteProfileData,
} from "@repo/contracts/coaching/athlete-profile";

import { prisma } from "../../db/client";
import { mapToAthleteProfile } from "../../mappers";
import { GENDER_TO_PRISMA_MAP, HEALTH_STATUS_TO_PRISMA_MAP } from "../../mappers/enum-maps";
import { findOrThrow, handlePrismaError } from "../../utils";

export const coachingAthleteProfileApi = {
  get: async (userId: string): Promise<AthleteProfile> => {
    const profile = await findOrThrow(
      prisma.athleteProfile.findUnique({ where: { userId } }),
      "Athlete profile",
    );

    return mapToAthleteProfile(profile);
  },

  upsert: async (userId: string, data: UpdateAthleteProfileData): Promise<AthleteProfile> => {
    const prismaData = {
      ...data,
      ...(data.gender && { gender: GENDER_TO_PRISMA_MAP[data.gender] }),
      ...(data.healthStatus && { healthStatus: HEALTH_STATUS_TO_PRISMA_MAP[data.healthStatus] }),
    };

    try {
      const profile = await prisma.athleteProfile.upsert({
        where: { userId },
        create: { userId, ...prismaData },
        update: prismaData,
      });

      return mapToAthleteProfile(profile);
    } catch (error) {
      return handlePrismaError(error, { entity: "Athlete profile" });
    }
  },
};
