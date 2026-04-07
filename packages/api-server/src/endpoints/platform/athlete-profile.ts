import {
  type AthleteProfile,
  type UpdateAthleteProfileData,
} from "@repo/contracts/athlete-profile";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToAthleteProfile } from "../../mappers";
import { handlePrismaError } from "../../utils";

export const platformAthleteProfileApi = {
  get: async (userId: string): Promise<AthleteProfile> => {
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundError("Athlete profile not found", { userId });
    }

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
