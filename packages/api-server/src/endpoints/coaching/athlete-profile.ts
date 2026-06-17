import {
  type AthleteProfile,
  type UpdateAthleteProfileData,
} from "@repo/contracts/coaching/athlete-profile";

import { prisma } from "../../db/client";
import {
  GENDER_TO_PRISMA_MAP,
  HEALTH_STATUS_TO_PRISMA_MAP,
  mapToAthleteProfile,
} from "../../mappers/coaching";
import { findOrThrow, handlePrismaError, toInputJson } from "../../utils";

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
      ...(data.gender && { gender: GENDER_TO_PRISMA_MAP[data.gender] }),
      ...(data.healthStatus && { healthStatus: HEALTH_STATUS_TO_PRISMA_MAP[data.healthStatus] }),
      ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
      ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
      ...(data.healthNote !== undefined && { healthNote: data.healthNote }),
      ...(data.profileSelections !== undefined && {
        profileSelections: toInputJson(data.profileSelections),
      }),
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
