import {
  type PlanStructureDay,
  type PlanStructureSession,
  type PlanStructureWeek,
} from "@repo/contracts/lms/training-plan";

export type NestedEntityCounts = {
  sessions?: number;
  blocks?: number;
};

const countSessionBlocks = (session: PlanStructureSession): number => session.blocks.length;

const countDayBlocks = (day: PlanStructureDay): number =>
  day.sessions.reduce((acc, session) => acc + countSessionBlocks(session), 0);

const countWeekBlocks = (week: PlanStructureWeek): number =>
  week.days.reduce((acc, day) => acc + countDayBlocks(day), 0);

const countWeekSessions = (week: PlanStructureWeek): number =>
  week.days.reduce((acc, day) => acc + day.sessions.length, 0);

export const countWeekEntities = (week: PlanStructureWeek): NestedEntityCounts => ({
  sessions: countWeekSessions(week),
  blocks: countWeekBlocks(week),
});

export const countDayEntities = (day: PlanStructureDay): NestedEntityCounts => ({
  sessions: day.sessions.length,
  blocks: countDayBlocks(day),
});

export const countSessionEntities = (session: PlanStructureSession): NestedEntityCounts => ({
  blocks: countSessionBlocks(session),
});

export const isContainerEmpty = (counts: NestedEntityCounts): boolean =>
  (counts.sessions ?? 0) === 0 && (counts.blocks ?? 0) === 0;
