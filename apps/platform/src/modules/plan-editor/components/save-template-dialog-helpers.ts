import {
  type GetPlanStructureResponse,
  type PlanStructureSession,
  type PlanStructureWeek,
} from "@repo/contracts/lms/training-plan";

export type SaveTemplateScope = "block" | "session" | "week";

export type SessionOption = {
  id: string;
  label: string;
  session: PlanStructureSession;
};

export type WeekOption = {
  id: string;
  label: string;
  week: PlanStructureWeek;
};

export const SCOPE_OPTIONS = [
  { value: "COACH", label: "Coach (mine)" },
  { value: "SYSTEM", label: "System (global)" },
] as const;

export const SCOPE_TABS: ReadonlyArray<{ value: SaveTemplateScope; label: string }> = [
  { value: "block", label: "Block" },
  { value: "session", label: "Session" },
  { value: "week", label: "Week" },
];

export const titleByScope: Record<SaveTemplateScope, string> = {
  block: "Save block as template",
  session: "Save session as template",
  week: "Save week as template",
};

export const collectSessions = (data: GetPlanStructureResponse | undefined): SessionOption[] => {
  if (!data) {
    return [];
  }

  const out: SessionOption[] = [];

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        const sessionLabel = session.label ?? `Session ${(session.order + 1).toString()}`;

        out.push({
          id: session.id,
          label: `W${(week.index + 1).toString()} · ${day.dayOfWeek} · ${sessionLabel}`,
          session,
        });
      }
    }
  }

  return out;
};

export const collectWeeks = (data: GetPlanStructureResponse | undefined): WeekOption[] => {
  if (!data) {
    return [];
  }

  return data.plan.weeks.map((week) => ({
    id: week.id,
    label: week.label ?? `Week ${(week.index + 1).toString()}`,
    week,
  }));
};

export const findSessionContaining = (
  data: GetPlanStructureResponse | undefined,
  blockId: string,
): PlanStructureSession | null => {
  if (!data) {
    return null;
  }

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        if (session.blocks.some((b) => b.id === blockId)) {
          return session;
        }
      }
    }
  }

  return null;
};

export const findWeekContaining = (
  data: GetPlanStructureResponse | undefined,
  blockId: string,
): PlanStructureWeek | null => {
  if (!data) {
    return null;
  }

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        if (session.blocks.some((b) => b.id === blockId)) {
          return week;
        }
      }
    }
  }

  return null;
};
