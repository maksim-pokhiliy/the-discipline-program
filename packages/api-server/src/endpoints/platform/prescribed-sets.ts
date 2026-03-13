import {
  type CreatePrescribedSetData,
  type PrescribedSet,
  type UpdatePrescribedSetData,
} from "@repo/contracts/prescribed-set";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToPrescribedSet } from "../../mappers";

import { resolveCoachId, verifyBlockOwnership } from "./guards";

export const platformPrescribedSetsApi = {
  getAll: async (userId: string, blockId: string): Promise<PrescribedSet[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyBlockOwnership(blockId, coachId);

    const sets = await prisma.prescribedSet.findMany({
      where: { blockId },
      orderBy: { sortOrder: "asc" },
    });

    return sets.map(mapToPrescribedSet);
  },

  getById: async (userId: string, blockId: string, id: string): Promise<PrescribedSet> => {
    const coachId = await resolveCoachId(userId);

    await verifyBlockOwnership(blockId, coachId);

    const set = await prisma.prescribedSet.findUnique({
      where: { id },
    });

    if (!set || set.blockId !== blockId) {
      throw new NotFoundError("Prescribed set not found", { id, blockId });
    }

    return mapToPrescribedSet(set);
  },

  create: async (
    userId: string,
    blockId: string,
    data: CreatePrescribedSetData,
  ): Promise<PrescribedSet> => {
    const coachId = await resolveCoachId(userId);

    await verifyBlockOwnership(blockId, coachId);

    const set = await prisma.prescribedSet.create({
      data: { blockId, ...data },
    });

    return mapToPrescribedSet(set);
  },

  update: async (
    userId: string,
    blockId: string,
    id: string,
    data: UpdatePrescribedSetData,
  ): Promise<PrescribedSet> => {
    const coachId = await resolveCoachId(userId);

    await verifyBlockOwnership(blockId, coachId);

    const existing = await prisma.prescribedSet.findUnique({
      where: { id },
      select: { blockId: true },
    });

    if (!existing || existing.blockId !== blockId) {
      throw new NotFoundError("Prescribed set not found", { id, blockId });
    }

    const set = await prisma.prescribedSet.update({
      where: { id },
      data,
    });

    return mapToPrescribedSet(set);
  },

  delete: async (userId: string, blockId: string, id: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyBlockOwnership(blockId, coachId);

    const existing = await prisma.prescribedSet.findUnique({
      where: { id },
      select: { blockId: true },
    });

    if (!existing || existing.blockId !== blockId) {
      throw new NotFoundError("Prescribed set not found", { id, blockId });
    }

    await prisma.prescribedSet.delete({ where: { id } });
  },
};
