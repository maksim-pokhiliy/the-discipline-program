import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

type StructureMutator = (current: GetPlanStructureResponse) => GetPlanStructureResponse;

export const buildOptimisticDeleteWeek =
  (weekId: string): StructureMutator =>
  (current) => ({
    ...current,
    plan: {
      ...current.plan,
      weeks: current.plan.weeks.filter((week) => week.id !== weekId),
    },
  });

export const buildOptimisticDeleteDay =
  (dayId: string): StructureMutator =>
  (current) => ({
    ...current,
    plan: {
      ...current.plan,
      weeks: current.plan.weeks.map((week) => ({
        ...week,
        days: week.days.filter((day) => day.id !== dayId),
      })),
    },
  });

export const buildOptimisticDeleteSession =
  (sessionId: string): StructureMutator =>
  (current) => ({
    ...current,
    plan: {
      ...current.plan,
      weeks: current.plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          sessions: day.sessions.filter((session) => session.id !== sessionId),
        })),
      })),
    },
  });
