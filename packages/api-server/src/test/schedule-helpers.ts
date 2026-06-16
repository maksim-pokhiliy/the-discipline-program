import {
  DayOfWeek,
  EnrollmentStatus,
  type Day,
  type Label,
  type PerformedSession,
  type PlanEnrollment,
  type Session,
  type Week,
} from "@prisma/client";

import { addDaysInTz, startOfWeekInTz } from "../utils/date-helpers";

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
  overrides: { startedAt?: Date; completedAt?: Date | null } = {},
): Promise<{ performed: PerformedSession; toCleanup: CleanupEntry[] }> => {
  const performed = await cleanupRaw.performedSession.create({
    data: {
      sessionId,
      userId,
      startedAt: overrides.startedAt ?? new Date(),
      completedAt: overrides.completedAt ?? null,
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
      startedAt: target.sessionDate,
      completedAt: target.sessionDate,
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
