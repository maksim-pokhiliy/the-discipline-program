import {
  type AthleteProfile,
  type CoachAthleteAssignment,
  type CoachProfile,
  type PlanEnrollment,
  type Prisma,
  PrismaClient,
  type TrainingPlan,
  type User,
} from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { logger } from "@repo/shared";

import { ROLE_TO_PRISMA_MAP } from "../mappers/iam";

export * from "./session-helpers";

const rawPrisma = new PrismaClient();

export const createTestUser = async (
  overrides: Partial<Parameters<typeof rawPrisma.user.create>[0]["data"]> = {},
) => {
  const id = crypto.randomUUID();

  return rawPrisma.user.create({
    data: {
      email: `test-${id}@test.local`,
      name: `Test User ${id.slice(0, 8)}`,
      role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE],
      ...overrides,
    },
  });
};

export const createTestCoach = async () => {
  const user = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
  const profile = await rawPrisma.coachProfile.create({
    data: { userId: user.id },
  });

  return { user, profile };
};

export const createTestPlan = async (
  creatorUserId: string,
  overrides: Partial<Prisma.TrainingPlanUncheckedCreateInput> = {},
) => {
  return rawPrisma.trainingPlan.create({
    data: {
      creatorId: creatorUserId,
      name: `Test Plan ${crypto.randomUUID().slice(0, 8)}`,
      ...overrides,
    },
  });
};

export const createTestEnrollment = async (
  planId: string,
  userId: string,
  overrides: Partial<Prisma.PlanEnrollmentUncheckedCreateInput> = {},
) => {
  return rawPrisma.planEnrollment.create({
    data: {
      planId,
      userId,
      startedAtWeekIndex: 0,
      startedOnDate: new Date(),
      ...overrides,
    },
  });
};

export const createTestAssignment = async (coachProfileId: string, athleteUserId: string) => {
  return rawPrisma.coachAthleteAssignment.create({
    data: { coachId: coachProfileId, athleteId: athleteUserId },
  });
};

export const createTestProduct = async (
  overrides: Partial<Prisma.ProductUncheckedCreateInput> = {},
) => {
  const id = crypto.randomUUID();

  return rawPrisma.product.create({
    data: {
      slug: `test-product-${id}`,
      title: `Test Product ${id.slice(0, 8)}`,
      description: `Test product description ${id.slice(0, 8)}`,
      ...overrides,
    },
  });
};

export const createTestBlogPost = async (
  overrides: Partial<Prisma.MarketingBlogPostUncheckedCreateInput> = {},
) => {
  const id = crypto.randomUUID();

  return rawPrisma.marketingBlogPost.create({
    data: {
      slug: `test-post-${id}`,
      title: `Test Blog Post ${id.slice(0, 8)}`,
      content: `Test content ${id.slice(0, 8)}`,
      authorName: `Test Author ${id.slice(0, 8)}`,
      ...overrides,
    },
  });
};

export const createTestReview = async (
  overrides: Partial<Prisma.MarketingReviewUncheckedCreateInput> = {},
) => {
  const id = crypto.randomUUID();

  return rawPrisma.marketingReview.create({
    data: {
      authorName: `Test Reviewer ${id.slice(0, 8)}`,
      text: `Test review text ${id.slice(0, 8)}`,
      rating: 5,
      ...overrides,
    },
  });
};

export const createTestContactSubmission = async (
  overrides: Partial<Prisma.MarketingContactSubmissionUncheckedCreateInput> = {},
) => {
  const id = crypto.randomUUID();

  return rawPrisma.marketingContactSubmission.create({
    data: {
      message: `Test contact message ${id.slice(0, 8)}`,
      name: `Test Contact ${id.slice(0, 8)}`,
      ...overrides,
    },
  });
};

export const createTestAthleteProfile = async (
  userId: string,
  overrides: Partial<Prisma.AthleteProfileUncheckedCreateInput> = {},
) => {
  return rawPrisma.athleteProfile.create({
    data: {
      userId,
      ...overrides,
    },
  });
};

export type TestScenario = {
  coach: { user: User; profile: CoachProfile };
  plan: TrainingPlan;
  athletes: {
    user: User;
    enrollment: PlanEnrollment;
    assignment: CoachAthleteAssignment | null;
    profile?: AthleteProfile;
  }[];
  toCleanup: { table: string; id: string }[];
};

export const createTestScenario = async (options?: {
  planOverrides?: Partial<Prisma.TrainingPlanUncheckedCreateInput>;
  athleteCount?: number;
  withAthleteProfiles?: boolean;
  withAssignments?: boolean;
}): Promise<TestScenario> => {
  const {
    planOverrides = {},
    athleteCount = 2,
    withAthleteProfiles = false,
    withAssignments = true,
  } = options ?? {};

  const toCleanup: { table: string; id: string }[] = [];

  const coach = await createTestCoach();

  toCleanup.push(
    { table: "coachProfile", id: coach.profile.id },
    { table: "user", id: coach.user.id },
  );

  const plan = await createTestPlan(coach.user.id, planOverrides);

  toCleanup.push({ table: "trainingPlan", id: plan.id });

  const athletes: TestScenario["athletes"] = [];

  for (let i = 0; i < athleteCount; i++) {
    const user = await createTestUser();

    toCleanup.push({ table: "user", id: user.id });

    const enrollment = await createTestEnrollment(plan.id, user.id);

    toCleanup.push({ table: "planEnrollment", id: enrollment.id });

    let assignment: CoachAthleteAssignment | null = null;

    if (withAssignments) {
      assignment = await createTestAssignment(coach.profile.id, user.id);
      toCleanup.push({ table: "coachAthleteAssignment", id: assignment.id });
    }

    let profile: AthleteProfile | undefined;

    if (withAthleteProfiles) {
      profile = await createTestAthleteProfile(user.id);
      toCleanup.push({ table: "athleteProfile", id: profile.id });
    }

    athletes.push({ user, enrollment, assignment, ...(profile && { profile }) });
  }

  return { coach, plan, athletes, toCleanup };
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

    await delegate.delete({ where: { id } }).catch((error: unknown) => {
      const code = (error as { code?: string }).code;

      if (code === "P2025") {
        return;
      }

      logger.error(`[test cleanup] failed to delete ${table}/${id}`, { error });
    });
  }
};

export const cleanupRaw = rawPrisma;
