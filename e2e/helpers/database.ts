import {
  type ExerciseLibraryItem,
  type PlanEnrollment,
  PlanEnrollmentStatus,
  type Prisma,
  PrismaClient,
  type SetLog,
  type TrainingPlan,
} from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

const getPrisma = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
};

export const seedTestBlogPost = async () => {
  const prisma = getPrisma();
  const ts = Date.now();
  return prisma.marketingBlogPost.create({
    data: {
      slug: `e2e-test-${ts}`,
      title: `E2E Test Post ${ts}`,
      content:
        "Created by E2E test. This content needs to be at least 100 characters long to pass the blog post content validation schema. Adding some extra text to reach the minimum.",
      authorName: "E2E",
    },
  });
};

export const seedTestContact = async () => {
  const prisma = getPrisma();
  return prisma.marketingContactSubmission.create({
    data: {
      name: "E2E Test Contact",
      contact: "e2e@test.com",
      message: "Created by E2E test for deletion",
      program: "Test Program",
    },
  });
};

export type SeedSystemExerciseInput = {
  name?: string;
  defaultMetrics?: Prisma.InputJsonValue;
  isBenchmark?: boolean;
};

export const seedSystemExercise = async (
  input: SeedSystemExerciseInput = {},
): Promise<ExerciseLibraryItem> => {
  const prisma = getPrisma();
  const suffix = crypto.randomUUID().slice(0, 8);
  const name = input.name ?? `E2E SYSTEM Exercise ${suffix}`;

  return prisma.exerciseLibraryItem.create({
    data: {
      scope: "SYSTEM",
      name,
      primaryMovement: "SQUAT",
      modality: "BARBELL",
      equipment: ["barbell"],
      primaryBodyParts: ["QUADS"],
      defaultMetrics:
        input.defaultMetrics ??
        ({
          canMeasureLoad: true,
          canMeasureReps: true,
          canMeasureDuration: false,
          canMeasureDistance: false,
          canMeasureCalories: false,
        } satisfies Prisma.InputJsonValue),
      isBenchmark: input.isBenchmark ?? false,
    },
  });
};

export type SeedCoachPlanInput = {
  creatorId: string;
  name?: string;
  description?: string;
};

export type SeedCoachPlanResult = {
  plan: TrainingPlan;
  weekId: string;
  dayId: string;
  sessionId: string;
  blockId: string;
  segmentId: string;
  setGroupId: string;
  entryId: string | null;
};

export const seedCoachPlan = async (input: SeedCoachPlanInput): Promise<SeedCoachPlanResult> => {
  const prisma = getPrisma();
  const suffix = crypto.randomUUID().slice(0, 8);

  const existingBlockKind = await prisma.blockKind.findFirst({
    where: { scope: "SYSTEM", ownerId: null, name: "E2E Strength" },
  });

  const blockKind =
    existingBlockKind ??
    (await prisma.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: "E2E Strength",
        defaultWeight: 5,
        defaultArchetypeKind: "COUNT_UP",
      },
    }));

  const plan = await prisma.trainingPlan.create({
    data: {
      creatorId: input.creatorId,
      name: input.name ?? `E2E Plan ${suffix}`,
      description: input.description ?? "Plan created by E2E helper",
      status: "DRAFT",
    },
  });

  const week = await prisma.week.create({
    data: { planId: plan.id, index: 0, label: "Week 1" },
  });

  const day = await prisma.day.create({
    data: { weekId: week.id, dayOfWeek: "MON", kind: "TRAINING" },
  });

  const session = await prisma.lmsSession.create({
    data: { dayId: day.id, order: 0, label: "Session 1" },
  });

  const block = await prisma.block.create({
    data: {
      sessionId: session.id,
      order: 0,
      kindId: blockKind.id,
      title: "Strength block",
      status: "ACTIVE",
      weight: 5,
    },
  });

  const segment = await prisma.blockSegment.create({
    data: {
      blockId: block.id,
      order: 0,
      label: "Main segment",
      archetypeKind: "COUNT_UP",
      schemeParams: { kind: "COUNT_UP", cap: 5, rounds: 3 } as Prisma.InputJsonValue,
    },
  });

  const setGroup = await prisma.setGroup.create({
    data: { segmentId: segment.id, order: 0, label: "Working sets" },
  });

  return {
    plan,
    weekId: week.id,
    dayId: day.id,
    sessionId: session.id,
    blockId: block.id,
    segmentId: segment.id,
    setGroupId: setGroup.id,
    entryId: null,
  };
};

export type SeedAthleteEnrollmentInput = {
  planId: string;
  athleteId: string;
  status?: PlanEnrollmentStatus;
};

export const seedAthleteEnrollment = async (
  input: SeedAthleteEnrollmentInput,
): Promise<PlanEnrollment> => {
  const prisma = getPrisma();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return prisma.planEnrollment.upsert({
    where: { planId_userId: { planId: input.planId, userId: input.athleteId } },
    update: {},
    create: {
      planId: input.planId,
      userId: input.athleteId,
      status: input.status ?? "ACTIVE",
      startedAtWeekIndex: 0,
      startedOnDate: today,
    },
  });
};

export type InsertWorkoutFlowInput = {
  athleteUserId: string;
  exerciseId: string;
  loadKg: number;
  reps: number;
  enrollmentId?: string;
};

export type InsertWorkoutFlowResult = {
  workoutSessionId: string;
  blockSessionId: string;
  exerciseLogId: string;
  setLog: SetLog;
};

export const insertWorkoutFlow = async (
  input: InsertWorkoutFlowInput,
): Promise<InsertWorkoutFlowResult> => {
  const prisma = getPrisma();
  const exercise = await prisma.exerciseLibraryItem.findUniqueOrThrow({
    where: { id: input.exerciseId },
  });
  const now = new Date();

  const workoutSession = await prisma.workoutSession.create({
    data: {
      userId: input.athleteUserId,
      enrollmentId: input.enrollmentId,
      startedAt: now,
      status: "IN_PROGRESS",
    },
  });

  const blockSession = await prisma.blockSession.create({
    data: {
      workoutSessionId: workoutSession.id,
      order: 0,
      kindName: "Strength",
      weight: 5,
      archetypeKind: "COUNT_UP",
      schemeParamsSnapshot: {
        kind: "COUNT_UP",
        cap: 5,
        rounds: 1,
      } as Prisma.InputJsonValue,
    },
  });

  const exerciseLog = await prisma.exerciseLog.create({
    data: {
      blockSessionId: blockSession.id,
      order: 0,
      exerciseId: input.exerciseId,
      exerciseSnapshot: {
        id: exercise.id,
        name: exercise.name,
        primaryMovement: exercise.primaryMovement,
        modality: exercise.modality,
        primaryBodyParts: exercise.primaryBodyParts,
        defaultMetrics: exercise.defaultMetrics,
        demoVideoUrl: exercise.demoVideoUrl,
        demoImageUrl: exercise.demoImageUrl,
      } as Prisma.InputJsonValue,
    },
  });

  const setLog = await prisma.setLog.create({
    data: {
      exerciseLogId: exerciseLog.id,
      order: 0,
      prescribed: { reps: { kind: "FIXED", value: input.reps } } as Prisma.InputJsonValue,
      actual: {
        load: { kind: "BARBELL", kg: input.loadKg },
        reps: input.reps,
      } as Prisma.InputJsonValue,
      completedAt: now,
    },
  });

  return {
    workoutSessionId: workoutSession.id,
    blockSessionId: blockSession.id,
    exerciseLogId: exerciseLog.id,
    setLog,
  };
};

export const cleanupByIds = async (entries: { table: string; id: string }[]) => {
  const prisma = getPrisma();
  for (const { table, id } of entries.reverse()) {
    const delegate = (prisma as unknown as Record<string, unknown>)[table] as
      | { delete: (args: { where: { id: string } }) => Promise<unknown> }
      | undefined;
    if (delegate) {
      await delegate.delete({ where: { id } }).catch(() => undefined);
    }
  }
};

export const disconnectDb = async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
};
