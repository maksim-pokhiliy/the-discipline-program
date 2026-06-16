import {
  type CoachProfile,
  type CoachProfilePageData,
  type SelfUpdateCoachProfileData,
  type UpdateCoachProfileData,
} from "@repo/contracts/coaching/coach-profile";

import { prisma } from "../../db/client";
import { mapToCoachCredential, mapToCoachProfile } from "../../mappers/coaching";
import { ROLE_MAP } from "../../mappers/iam";
import { findOrThrow, handlePrismaError } from "../../utils";

export const computeMonthsActive = (createdAt: Date, now: Date): number => {
  const months =
    (now.getFullYear() - createdAt.getFullYear()) * 12 +
    (now.getMonth() - createdAt.getMonth()) -
    (now.getDate() < createdAt.getDate() ? 1 : 0);

  return Math.max(months, 0);
};

type UserUpdatePayload = {
  name?: string | null;
  image?: string | null;
  timezone?: string;
};

type ProfileUpdatePayload = {
  bio?: string | null;
  location?: string | null;
  specialties?: string[];
};

const buildUserPayload = (data: SelfUpdateCoachProfileData): UserUpdatePayload => {
  const payload: UserUpdatePayload = {};

  if (data.name !== undefined) {
    payload.name = data.name;
  }

  if (data.image !== undefined) {
    payload.image = data.image;
  }

  if (data.timezone !== undefined) {
    payload.timezone = data.timezone;
  }

  return payload;
};

const buildProfilePayload = (data: SelfUpdateCoachProfileData): ProfileUpdatePayload => {
  const payload: ProfileUpdatePayload = {};

  if (data.bio !== undefined) {
    payload.bio = data.bio;
  }

  if (data.location !== undefined) {
    payload.location = data.location;
  }

  if (data.specialties !== undefined) {
    payload.specialties = data.specialties;
  }

  return payload;
};

const getCoachProfilePageData = async (userId: string): Promise<CoachProfilePageData> => {
  const profile = await findOrThrow(
    prisma.coachProfile.findUnique({
      where: { userId },
      include: { credentials: { orderBy: { createdAt: "asc" } } },
    }),
    "Coach profile",
  );

  const [user, athletesCoached, plansAuthored] = await Promise.all([
    findOrThrow(
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          image: true,
          role: true,
          timezone: true,
          createdAt: true,
        },
      }),
      "User",
    ),
    prisma.coachAthleteAssignment.count({ where: { coachId: profile.id } }),
    prisma.trainingPlan.count({ where: { creatorId: userId, deletedAt: null } }),
  ]);

  return {
    user: {
      name: user.name,
      email: user.email,
      image: user.image,
      role: ROLE_MAP[user.role],
      timezone: user.timezone,
      createdAt: user.createdAt,
    },
    profile: {
      bio: profile.bio,
      location: profile.location,
      specialties: profile.specialties,
    },
    credentials: profile.credentials.map(mapToCoachCredential),
    trackRecord: {
      monthsActive: computeMonthsActive(user.createdAt, new Date()),
      athletesCoached,
      plansAuthored,
    },
  };
};

export const coachingCoachProfileApi = {
  get: async (userId: string): Promise<CoachProfile> => {
    const profile = await findOrThrow(
      prisma.coachProfile.findUnique({ where: { userId } }),
      "Coach profile",
    );

    return mapToCoachProfile(profile);
  },

  upsert: async (userId: string, data: UpdateCoachProfileData): Promise<CoachProfile> => {
    const prismaData = {
      ...(data.bio !== undefined && { bio: data.bio }),
    };

    try {
      const profile = await prisma.coachProfile.upsert({
        where: { userId },
        create: { userId, ...prismaData },
        update: prismaData,
      });

      return mapToCoachProfile(profile);
    } catch (error) {
      return handlePrismaError(error, { entity: "Coach profile" });
    }
  },

  getPageData: (userId: string): Promise<CoachProfilePageData> => getCoachProfilePageData(userId),

  update: async (
    userId: string,
    data: SelfUpdateCoachProfileData,
  ): Promise<CoachProfilePageData> => {
    const userPayload = buildUserPayload(data);
    const profilePayload = buildProfilePayload(data);

    try {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(userPayload).length > 0) {
          await tx.user.update({ where: { id: userId }, data: userPayload });
        }

        await tx.coachProfile.upsert({
          where: { userId },
          create: { userId, ...profilePayload },
          update: profilePayload,
        });
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Coach profile" });
    }

    return getCoachProfilePageData(userId);
  },
};
