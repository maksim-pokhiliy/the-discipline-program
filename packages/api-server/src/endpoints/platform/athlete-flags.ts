import {
  type AthleteFlag,
  type CreateAthleteFlagData,
  type UpdateAthleteFlagData,
} from "@repo/contracts/athlete-flag";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

import { resolveCoachId } from "./guards";

const mapToAthleteFlag = (f: {
  id: string;
  coachId: string;
  athleteId: string;
  type: string;
  note: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AthleteFlag => ({
  id: f.id,
  coachId: f.coachId,
  athleteId: f.athleteId,
  type: f.type as AthleteFlag["type"],
  note: f.note,
  resolvedAt: f.resolvedAt,
  createdAt: f.createdAt,
  updatedAt: f.updatedAt,
});

export const platformAthleteFlagsApi = {
  getAll: async (userId: string): Promise<AthleteFlag[]> => {
    const coachId = await resolveCoachId(userId);

    const flags = await prisma.athleteFlag.findMany({
      where: { coachId },
      orderBy: { createdAt: "desc" },
    });

    return flags.map(mapToAthleteFlag);
  },

  getById: async (userId: string, flagId: string): Promise<AthleteFlag> => {
    const coachId = await resolveCoachId(userId);

    const flag = await prisma.athleteFlag.findUnique({ where: { id: flagId } });

    if (!flag || flag.coachId !== coachId) {
      throw new NotFoundError("Athlete flag not found", { flagId });
    }

    return mapToAthleteFlag(flag);
  },

  create: async (userId: string, data: CreateAthleteFlagData): Promise<AthleteFlag> => {
    const coachId = await resolveCoachId(userId);

    const athlete = await prisma.user.findUnique({
      where: { id: data.athleteId },
      select: { id: true, deletedAt: true },
    });

    if (!athlete || athlete.deletedAt) {
      throw new NotFoundError("Athlete not found", { athleteId: data.athleteId });
    }

    const flag = await prisma.athleteFlag.create({
      data: { coachId, ...data },
    });

    return mapToAthleteFlag(flag);
  },

  update: async (
    userId: string,
    flagId: string,
    data: UpdateAthleteFlagData,
  ): Promise<AthleteFlag> => {
    const coachId = await resolveCoachId(userId);

    const existing = await prisma.athleteFlag.findUnique({ where: { id: flagId } });

    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError("Athlete flag not found", { flagId });
    }

    const flag = await prisma.athleteFlag.update({
      where: { id: flagId },
      data,
    });

    return mapToAthleteFlag(flag);
  },

  resolve: async (userId: string, flagId: string): Promise<AthleteFlag> => {
    const coachId = await resolveCoachId(userId);

    const existing = await prisma.athleteFlag.findUnique({ where: { id: flagId } });

    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError("Athlete flag not found", { flagId });
    }

    const flag = await prisma.athleteFlag.update({
      where: { id: flagId },
      data: { resolvedAt: new Date() },
    });

    return mapToAthleteFlag(flag);
  },

  delete: async (userId: string, flagId: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    const existing = await prisma.athleteFlag.findUnique({ where: { id: flagId } });

    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError("Athlete flag not found", { flagId });
    }

    await prisma.athleteFlag.delete({ where: { id: flagId } });
  },
};
