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

import { assertAndPruneProfileSelections } from "./profile-selections-guard";

export const coachingAthleteProfileApi = {
  get: async (userId: string): Promise<AthleteProfile> => {
    const profile = await findOrThrow(
      prisma.athleteProfile.findUnique({
        where: { userId },
        include: { user: { select: { image: true } } },
      }),
      "Athlete profile",
    );

    return mapToAthleteProfile(profile, profile.user.image);
  },

  upsert: async (userId: string, data: UpdateAthleteProfileData): Promise<AthleteProfile> => {
    const profileSelections =
      data.profileSelections === undefined
        ? undefined
        : await assertAndPruneProfileSelections(data.profileSelections);

    const prismaData = {
      ...(data.gender && { gender: GENDER_TO_PRISMA_MAP[data.gender] }),
      ...(data.healthStatus && { healthStatus: HEALTH_STATUS_TO_PRISMA_MAP[data.healthStatus] }),
      ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
      ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
      ...(data.healthNote !== undefined && { healthNote: data.healthNote }),
      ...(profileSelections !== undefined && {
        profileSelections: toInputJson(profileSelections),
      }),
    };

    try {
      const profile = await prisma.$transaction(async (tx) => {
        if (data.image !== undefined) {
          await tx.user.update({ where: { id: userId }, data: { image: data.image } });
        }

        return tx.athleteProfile.upsert({
          where: { userId },
          create: { userId, ...prismaData },
          update: prismaData,
          include: { user: { select: { image: true } } },
        });
      });

      return mapToAthleteProfile(profile, profile.user.image);
    } catch (error) {
      return handlePrismaError(error, { entity: "Athlete profile" });
    }
  },
};
