import {
  type AthleteProfile,
  type UpdateAthleteProfileData,
} from "@repo/contracts/athlete-profile";

import { prisma } from "../../db/client";
import { mapToAthleteProfile } from "../../mappers";
import { findOrThrow, handlePrismaError } from "../../utils";

export const platformAthleteProfileApi = {
  get: async (userId: string): Promise<AthleteProfile> => {
    const profile = await findOrThrow(
      prisma.athleteProfile.findUnique({ where: { userId } }),
      "Athlete profile",
    );

    return mapToAthleteProfile(profile);
  },

  upsert: async (userId: string, data: UpdateAthleteProfileData): Promise<AthleteProfile> => {
    try {
      const profile = await prisma.athleteProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });

      return mapToAthleteProfile(profile);
    } catch (error) {
      return handlePrismaError(error, { entity: "Athlete profile" });
    }
  },
};
