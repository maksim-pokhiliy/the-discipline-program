import {
  type CoachProfile,
  type UpdateCoachProfileData,
} from "@repo/contracts/coaching/coach-profile";

import { prisma } from "../../db/client";
import { mapToCoachProfile } from "../../mappers/coaching";
import { findOrThrow, handlePrismaError } from "../../utils";

export const coachingCoachProfileApi = {
  get: async (userId: string): Promise<CoachProfile> => {
    const profile = await findOrThrow(
      prisma.coachProfile.findUnique({ where: { userId } }),
      "Coach profile",
    );

    return mapToCoachProfile(profile);
  },

  upsert: async (userId: string, data: UpdateCoachProfileData): Promise<CoachProfile> => {
    try {
      const profile = await prisma.coachProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });

      return mapToCoachProfile(profile);
    } catch (error) {
      return handlePrismaError(error, { entity: "Coach profile" });
    }
  },
};
