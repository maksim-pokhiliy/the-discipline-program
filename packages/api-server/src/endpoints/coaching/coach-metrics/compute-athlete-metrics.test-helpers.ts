import { type DayOfWeek, EnrollmentStatus } from "@prisma/client";

import {
  buildPerformedKey,
  type PerformedByKey,
  type WindowedDay,
  type WindowedEnrollment,
  type WindowedSession,
} from "./coach-metrics.types";

const EPOCH = new Date(0);

type LabelInput = { name: string; rest: boolean } | null;

type SessionInput = { id: string; label?: LabelInput };

type DayInput = { dayOfWeek: DayOfWeek; label?: LabelInput; sessions: SessionInput[] };

type WeekInput = { id: string; startDate: Date; days: DayInput[] };

type EnrollmentInput = {
  id?: string;
  planId?: string;
  planName?: string;
  athleteId: string;
  boardedAt: Date;
  status?: EnrollmentStatus;
  weeks: WeekInput[];
};

const makeSession = (input: SessionInput, dayId: string): WindowedSession => ({
  id: input.id,
  dayId,
  order: 0,
  labelId: input.label ? input.label.name : null,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  label: input.label ?? null,
});

const makeDay = (input: DayInput, weekId: string): WindowedDay => {
  const dayId = `${weekId}-${input.dayOfWeek}`;

  return {
    id: dayId,
    weekId,
    dayOfWeek: input.dayOfWeek,
    labelId: input.label ? input.label.name : null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    label: input.label ?? null,
    sessions: input.sessions.map((session) => makeSession(session, dayId)),
  };
};

export const makeEnrollment = (input: EnrollmentInput): WindowedEnrollment => {
  const planId = input.planId ?? "plan-1";

  return {
    id: input.id ?? "enrollment-1",
    planId,
    athleteId: input.athleteId,
    enrolledById: "coach-user",
    boardedAt: input.boardedAt,
    status: input.status ?? EnrollmentStatus.ACTIVE,
    statusChangedAt: EPOCH,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    deletedAt: null,
    plan: {
      id: planId,
      creatorId: "coach-user",
      status: "ACTIVE",
      name: input.planName ?? "Strength Plan",
      description: null,
      createdAt: EPOCH,
      updatedAt: EPOCH,
      deletedAt: null,
      weeks: input.weeks.map((week) => ({
        id: week.id,
        planId,
        startDate: week.startDate,
        notes: null,
        createdAt: EPOCH,
        updatedAt: EPOCH,
        days: week.days.map((day) => makeDay(day, week.id)),
      })),
    },
  };
};

export const workoutLabel = (name: string): LabelInput => ({ name, rest: false });

export const restLabel: LabelInput = { name: "Rest", rest: true };

export const performed = (
  athleteId: string,
  entries: { sessionId: string; startedAt: Date; completedAt: Date | null }[],
): PerformedByKey => {
  const map: PerformedByKey = new Map();

  for (const entry of entries) {
    map.set(buildPerformedKey(athleteId, entry.sessionId), {
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
    });
  }

  return map;
};
