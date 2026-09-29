import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../mappers/iam";

import { cleanupRaw } from "./helpers";

const TEARDOWN_AND_RELEASE_FAILED =
  "the teardown failed, and giving the head-coach slot back failed as well";

export type HeadCoachHolder = { id: string; updatedAt: Date };

export type HeadCoachSlot = { previousHolders: HeadCoachHolder[] };

export const findHeadCoachHolders = (
  client: Prisma.TransactionClient = cleanupRaw,
): Promise<HeadCoachHolder[]> =>
  client.user.findMany({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
    select: { id: true, updatedAt: true },
    orderBy: { id: "asc" },
  });

export const takeHeadCoachSlot = async (): Promise<HeadCoachSlot> => {
  const previousHolders = await findHeadCoachHolders();

  await cleanupRaw.user.updateMany({
    where: { id: { in: previousHolders.map((holder) => holder.id) } },
    data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
  });

  return { previousHolders };
};

export const releaseHeadCoachSlot = async ({ previousHolders }: HeadCoachSlot): Promise<void> => {
  for (const { id, updatedAt } of previousHolders) {
    await cleanupRaw.user.update({
      where: { id },
      data: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH], updatedAt },
    });
  }
};

const releaseAfterFailedTeardown = async (
  slot: HeadCoachSlot | undefined,
  teardownError: unknown,
): Promise<void> => {
  if (slot === undefined) {
    return;
  }

  try {
    await releaseHeadCoachSlot(slot);
  } catch (releaseError: unknown) {
    throw new AggregateError([teardownError, releaseError], TEARDOWN_AND_RELEASE_FAILED);
  }
};

export const releaseHeadCoachSlotAfter = async (
  slot: HeadCoachSlot | undefined,
  teardown: () => Promise<unknown>,
): Promise<void> => {
  try {
    await teardown();
  } catch (teardownError: unknown) {
    await releaseAfterFailedTeardown(slot, teardownError);

    throw teardownError;
  }

  if (slot !== undefined) {
    await releaseHeadCoachSlot(slot);
  }
};
