import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../mappers/iam";

import { cleanupRaw } from "./helpers";

type HeadCoachHolder = { id: string; updatedAt: Date };

export type HeadCoachSlot = { previousHolders: HeadCoachHolder[] };

const findHeadCoachHolders = (): Promise<HeadCoachHolder[]> =>
  cleanupRaw.user.findMany({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
    select: { id: true, updatedAt: true },
    orderBy: { id: "asc" },
  });

export const findHeadCoachIds = async (): Promise<string[]> =>
  (await findHeadCoachHolders()).map((holder) => holder.id);

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
