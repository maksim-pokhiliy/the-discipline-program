import { PrismaClient } from "@prisma/client";

import { UserRole } from "@repo/contracts/auth";

const rawPrisma = new PrismaClient();

export const createTestUser = async (
  overrides: Partial<Parameters<typeof rawPrisma.user.create>[0]["data"]> = {},
) => {
  const id = crypto.randomUUID();

  return rawPrisma.user.create({
    data: {
      email: `test-${id}@test.local`,
      name: `Test User ${id.slice(0, 8)}`,
      role: UserRole.USER,
      ...overrides,
    },
  });
};

export const createTestCoach = async () => {
  const user = await createTestUser({ role: UserRole.COACH });
  const profile = await rawPrisma.coachProfile.create({
    data: { userId: user.id },
  });

  return { user, profile };
};

export const createTestPlan = async (
  coachProfileId: string,
  overrides: Record<string, unknown> = {},
) => {
  return rawPrisma.trainingPlan.create({
    data: {
      coachId: coachProfileId,
      name: `Test Plan ${crypto.randomUUID().slice(0, 8)}`,
      ...overrides,
    },
  });
};

export const cleanup = async (...ids: { table: string; id: string }[]) => {
  for (const { table, id } of ids.reverse()) {
    const delegate = (
      rawPrisma as unknown as Record<
        string,
        { delete: (args: { where: { id: string } }) => Promise<unknown> }
      >
    )[table];

    if (!delegate) {
      continue;
    }

    await delegate.delete({ where: { id } }).catch(() => {});
  }
};

export const cleanupRaw = rawPrisma;
