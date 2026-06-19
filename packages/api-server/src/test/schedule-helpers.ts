import {
  DayOfWeek,
  EnrollmentStatus,
  OneRMRecordSource,
  type BenchmarkResult,
  type Block,
  type Day,
  type Label,
  type OneRMRecord,
  type PerformedSession,
  type PlanEnrollment,
  type Schema,
  type Session,
  type Week,
} from "@prisma/client";

import { type Result, type ResultType } from "@repo/contracts/lms/_shared";

import { addDaysInTz, startOfWeekInTz } from "../utils/date-helpers";
import { toInputJson } from "../utils/to-input-json";

import { cleanupRaw, createTestCoach, createTestPlan, createTestUser } from "./helpers";

export type CleanupEntry = { table: string; id: string };

const uniqueSuffix = (): string => crypto.randomUUID().slice(0, 8);

const WEEKDAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const createTestEnrollment = async (
  planId: string,
  athleteUserId: string,
  enrolledByUserId: string,
  overrides: { boardedAt?: Date; status?: EnrollmentStatus } = {},
): Promise<{ enrollment: PlanEnrollment; toCleanup: CleanupEntry[] }> => {
  const enrollment = await cleanupRaw.planEnrollment.create({
    data: {
      planId,
      athleteId: athleteUserId,
      enrolledById: enrolledByUserId,
      boardedAt: overrides.boardedAt ?? new Date(),
      status: overrides.status ?? EnrollmentStatus.ACTIVE,
    },
  });

  return { enrollment, toCleanup: [{ table: "planEnrollment", id: enrollment.id }] };
};

export const createTestWeek = async (
  planId: string,
  overrides: { startDate: Date },
): Promise<{ week: Week; toCleanup: CleanupEntry[] }> => {
  const week = await cleanupRaw.week.create({
    data: { planId, startDate: overrides.startDate },
  });

  return { week, toCleanup: [{ table: "week", id: week.id }] };
};

export const createTestDay = async (
  weekId: string,
  overrides: { dayOfWeek: DayOfWeek; labelId?: string | null },
): Promise<{ day: Day; toCleanup: CleanupEntry[] }> => {
  const day = await cleanupRaw.day.create({
    data: {
      weekId,
      dayOfWeek: overrides.dayOfWeek,
      labelId: overrides.labelId ?? null,
    },
  });

  return { day, toCleanup: [{ table: "day", id: day.id }] };
};

export const createTestSession = async (
  dayId: string,
  overrides: { order?: number; labelId?: string | null } = {},
): Promise<{ session: Session; toCleanup: CleanupEntry[] }> => {
  const session = await cleanupRaw.session.create({
    data: {
      dayId,
      order: overrides.order ?? 0,
      labelId: overrides.labelId ?? null,
    },
  });

  return { session, toCleanup: [{ table: "session", id: session.id }] };
};

export const createTestLabel = async (
  overrides: { name?: string; rest?: boolean } = {},
): Promise<{ label: Label; toCleanup: CleanupEntry[] }> => {
  const name = overrides.name ?? `Label ${uniqueSuffix()}`;
  const label = await cleanupRaw.label.create({
    data: {
      name,
      nameLower: `${name.toLowerCase()}-${uniqueSuffix()}`,
      applicableLevels: [],
      rest: overrides.rest ?? false,
    },
  });

  return { label, toCleanup: [{ table: "label", id: label.id }] };
};

export const createTestPerformedSession = async (
  sessionId: string,
  userId: string,
  overrides: { performedAt?: Date } = {},
): Promise<{ performed: PerformedSession; toCleanup: CleanupEntry[] }> => {
  const performed = await cleanupRaw.performedSession.create({
    data: {
      sessionId,
      userId,
      performedAt: overrides.performedAt ?? new Date(),
    },
  });

  return { performed, toCleanup: [{ table: "performedSession", id: performed.id }] };
};

export type ScheduledSessionRef = {
  weekIndex: number;
  dayIndex: number;
  sessionId: string;
  dayOfWeek: DayOfWeek;
  sessionDate: Date;
};

export type ScheduleScenario = {
  coach: Awaited<ReturnType<typeof createTestCoach>>;
  athlete: Awaited<ReturnType<typeof createTestUser>>;
  plan: Awaited<ReturnType<typeof createTestPlan>>;
  assignmentId: string;
  enrollment: PlanEnrollment;
  sessions: ScheduledSessionRef[];
  performed: PerformedSession[];
  toCleanup: CleanupEntry[];
};

export type CompletionRef = { weekIndex: number; dayIndex: number };

type ScheduleScenarioOptions = {
  coach?: Awaited<ReturnType<typeof createTestCoach>>;
  athlete?: Awaited<ReturnType<typeof createTestUser>>;
  tz?: string;
  weeksBack: number;
  sessionsPerWeek: number;
  completions?: CompletionRef[];
  planStatus?: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export const createTestScheduleScenario = async (
  options: ScheduleScenarioOptions,
): Promise<ScheduleScenario> => {
  const tz = options.tz ?? "UTC";
  const sessionsPerWeek = Math.min(options.sessionsPerWeek, WEEKDAY_ORDER.length);
  const completions = options.completions ?? [];
  const toCleanup: CleanupEntry[] = [];

  const coach = options.coach ?? (await createTestCoach());

  if (!options.coach) {
    toCleanup.push(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  }

  await cleanupRaw.user.update({ where: { id: coach.user.id }, data: { timezone: tz } });

  const athlete = options.athlete ?? (await createTestUser());

  if (!options.athlete) {
    toCleanup.push({ table: "user", id: athlete.id });
  }

  const plan = await createTestPlan(coach.user.id, { status: options.planStatus ?? "ACTIVE" });

  toCleanup.push({ table: "trainingPlan", id: plan.id });

  const assignment = await cleanupRaw.coachAthleteAssignment.create({
    data: { coachId: coach.profile.id, athleteId: athlete.id },
  });

  toCleanup.push({ table: "coachAthleteAssignment", id: assignment.id });

  const thisWeekStart = startOfWeekInTz(new Date(), tz);

  const enrollmentResult = await createTestEnrollment(plan.id, athlete.id, coach.user.id, {
    boardedAt: addDaysInTz(thisWeekStart, -options.weeksBack * WEEKDAY_ORDER.length, tz),
  });

  toCleanup.push(...enrollmentResult.toCleanup);

  const workoutLabelResult = await createTestLabel({ name: "Workout", rest: false });

  toCleanup.push(...workoutLabelResult.toCleanup);

  const sessions: ScheduledSessionRef[] = [];

  for (let weekIndex = options.weeksBack; weekIndex >= 0; weekIndex--) {
    const startDate = addDaysInTz(thisWeekStart, -weekIndex * WEEKDAY_ORDER.length, tz);
    const weekResult = await createTestWeek(plan.id, { startDate });

    toCleanup.push(...weekResult.toCleanup);

    for (let dayIndex = 0; dayIndex < sessionsPerWeek; dayIndex++) {
      const dayOfWeek = WEEKDAY_ORDER[dayIndex] ?? DayOfWeek.MONDAY;
      const dayResult = await createTestDay(weekResult.week.id, {
        dayOfWeek,
        labelId: workoutLabelResult.label.id,
      });

      toCleanup.push(...dayResult.toCleanup);

      const sessionResult = await createTestSession(dayResult.day.id, {
        order: 0,
        labelId: workoutLabelResult.label.id,
      });

      toCleanup.push(...sessionResult.toCleanup);

      sessions.push({
        weekIndex,
        dayIndex,
        sessionId: sessionResult.session.id,
        dayOfWeek,
        sessionDate: addDaysInTz(startDate, dayIndex, tz),
      });
    }
  }

  const performed: PerformedSession[] = [];

  for (const completion of completions) {
    const target = sessions.find(
      (session) =>
        session.weekIndex === completion.weekIndex && session.dayIndex === completion.dayIndex,
    );

    if (!target) {
      continue;
    }

    const performedResult = await createTestPerformedSession(target.sessionId, athlete.id, {
      performedAt: target.sessionDate,
    });

    toCleanup.push(...performedResult.toCleanup);
    performed.push(performedResult.performed);
  }

  return {
    coach,
    athlete,
    plan,
    assignmentId: assignment.id,
    enrollment: enrollmentResult.enrollment,
    sessions,
    performed,
    toCleanup,
  };
};

export const createTestOneRMRecord = async (
  userId: string,
  exerciseId: string,
  overrides: { valueKg?: number; recordedAt?: Date; source?: OneRMRecordSource } = {},
): Promise<{ record: OneRMRecord; toCleanup: CleanupEntry[] }> => {
  const record = await cleanupRaw.oneRMRecord.create({
    data: {
      userId,
      exerciseId,
      valueKg: overrides.valueKg ?? 100,
      recordedAt: overrides.recordedAt ?? new Date(),
      source: overrides.source ?? OneRMRecordSource.MANUAL,
    },
  });

  return { record, toCleanup: [{ table: "oneRMRecord", id: record.id }] };
};

export type BenchmarkSchemaRef = {
  week: Week;
  day: Day;
  session: Session;
  block: Block;
  schema: Schema;
};

export const createTestBenchmarkSchema = async (
  planId: string,
  overrides: { resultType: ResultType; startDate?: Date },
): Promise<BenchmarkSchemaRef & { toCleanup: CleanupEntry[] }> => {
  const week = await cleanupRaw.week.create({
    data: { planId, startDate: overrides.startDate ?? new Date("2026-01-05T00:00:00.000Z") },
  });
  const day = await cleanupRaw.day.create({
    data: { weekId: week.id, dayOfWeek: DayOfWeek.MONDAY },
  });
  const session = await cleanupRaw.session.create({
    data: { dayId: day.id, order: 0 },
  });
  const block = await cleanupRaw.block.create({
    data: { sessionId: session.id, order: 0 },
  });
  const schema = await cleanupRaw.schema.create({
    data: {
      blockId: block.id,
      order: 0,
      composition: toInputJson({ benchmark: { resultType: overrides.resultType } }),
    },
  });

  return {
    week,
    day,
    session,
    block,
    schema,
    toCleanup: [
      { table: "week", id: week.id },
      { table: "day", id: day.id },
      { table: "session", id: session.id },
      { table: "block", id: block.id },
      { table: "schema", id: schema.id },
    ],
  };
};

export const createTestBenchmarkResult = async (
  userId: string,
  plannedSchemaId: string,
  result: Result,
  overrides: { recordedAt?: Date } = {},
): Promise<{ result: BenchmarkResult; toCleanup: CleanupEntry[] }> => {
  const created = await cleanupRaw.benchmarkResult.create({
    data: {
      userId,
      plannedSchemaId,
      result: toInputJson(result),
      recordedAt: overrides.recordedAt ?? new Date(),
    },
  });

  return { result: created, toCleanup: [{ table: "benchmarkResult", id: created.id }] };
};
