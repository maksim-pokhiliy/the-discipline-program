import { type CoachProfile, type UpdateCoachProfileData } from "@repo/contracts/coach-profile";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToCoachProfile } from "../../mappers";
import { handlePrismaError } from "../../utils";

export const platformCoachProfileApi = {
  get: async (userId: string): Promise<CoachProfile> => {
    const profile = await prisma.coachProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundError("Coach profile not found", { userId });
    }

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
