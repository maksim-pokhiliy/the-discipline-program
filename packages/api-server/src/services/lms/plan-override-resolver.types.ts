import { type Prisma, type PrismaClient } from "@prisma/client";

import { type PlanOverrideKind } from "@repo/contracts/lms/plan-override";

export type Db = PrismaClient | Prisma.TransactionClient;

export type EffectiveNode = {
  isOverridden: boolean;
  overrideKind: PlanOverrideKind | null;
  notes: string[];
  suspended: boolean;
};

export const baseNode = (): EffectiveNode => ({
  isOverridden: false,
  overrideKind: null,
  notes: [],
  suspended: false,
});
