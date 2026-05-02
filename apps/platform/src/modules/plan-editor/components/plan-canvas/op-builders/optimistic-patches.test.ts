import { describe, expect, it } from "vitest";

import {
  type GetPlanStructureResponse,
  type PlanStructureDay,
  type PlanStructureSession,
  type PlanStructureWeek,
  TrainingPlanStatus,
} from "@repo/contracts/lms/training-plan";

import {
  buildOptimisticDeleteDay,
  buildOptimisticDeleteSession,
  buildOptimisticDeleteWeek,
} from "./optimistic-patches";

const VALID_CUID_PLAN = "ckxw5p7gp0000q1mnzv5cu000";
const VALID_CUID_WEEK_A = "ckxw5p7gp0000q1mnzv5cu001";
const VALID_CUID_WEEK_B = "ckxw5p7gp0000q1mnzv5cu002";
const VALID_CUID_DAY_A = "ckxw5p7gp0000q1mnzv5cu003";
const VALID_CUID_DAY_B = "ckxw5p7gp0000q1mnzv5cu004";
const VALID_CUID_SESSION_A = "ckxw5p7gp0000q1mnzv5cu005";
const VALID_CUID_SESSION_B = "ckxw5p7gp0000q1mnzv5cu006";

const makeSession = (id: string, dayId: string, order: number): PlanStructureSession => ({
  id,
  dayId,
  order,
  label: null,
  notes: null,
  blocks: [],
});

const makeDay = (
  id: string,
  weekId: string,
  sessions: PlanStructureSession[],
): PlanStructureDay => ({
  id,
  weekId,
  dayOfWeek: "MON",
  kind: "TRAINING",
  notes: null,
  sessions,
});

const makeWeek = (id: string, index: number, days: PlanStructureDay[]): PlanStructureWeek => ({
  id,
  planId: VALID_CUID_PLAN,
  index,
  label: null,
  notes: null,
  days,
});

const makeStructure = (weeks: PlanStructureWeek[]): GetPlanStructureResponse => ({
  plan: {
    id: VALID_CUID_PLAN,
    creatorId: "ckxw5p7gp0000q1mnzv5cu999",
    name: "Test Plan",
    description: null,
    status: TrainingPlanStatus.DRAFT,
    licensable: false,
    originalPlanId: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    weeks,
  },
  window: { fromWeek: 0, toWeek: weeks.length, maxIndex: Math.max(0, weeks.length - 1) },
});

describe("buildOptimisticDeleteWeek — removes week from structure cache", () => {
  it("filters out the matching week and preserves others", () => {
    const structure = makeStructure([
      makeWeek(VALID_CUID_WEEK_A, 0, []),
      makeWeek(VALID_CUID_WEEK_B, 1, []),
    ]);

    const next = buildOptimisticDeleteWeek(VALID_CUID_WEEK_A)(structure);

    expect(next.plan.weeks).toHaveLength(1);
    expect(next.plan.weeks[0]?.id).toBe(VALID_CUID_WEEK_B);
  });

  it("returns identical weeks array when target week is absent", () => {
    const structure = makeStructure([makeWeek(VALID_CUID_WEEK_B, 1, [])]);

    const next = buildOptimisticDeleteWeek(VALID_CUID_WEEK_A)(structure);

    expect(next.plan.weeks).toHaveLength(1);
    expect(next.plan.weeks[0]?.id).toBe(VALID_CUID_WEEK_B);
  });
});

describe("buildOptimisticDeleteDay — removes day from its week", () => {
  it("filters the day from the matching week and preserves siblings", () => {
    const structure = makeStructure([
      makeWeek(VALID_CUID_WEEK_A, 0, [
        makeDay(VALID_CUID_DAY_A, VALID_CUID_WEEK_A, []),
        makeDay(VALID_CUID_DAY_B, VALID_CUID_WEEK_A, []),
      ]),
    ]);

    const next = buildOptimisticDeleteDay(VALID_CUID_DAY_A)(structure);

    expect(next.plan.weeks[0]?.days).toHaveLength(1);
    expect(next.plan.weeks[0]?.days[0]?.id).toBe(VALID_CUID_DAY_B);
  });

  it("does not touch unrelated weeks", () => {
    const structure = makeStructure([
      makeWeek(VALID_CUID_WEEK_A, 0, [makeDay(VALID_CUID_DAY_A, VALID_CUID_WEEK_A, [])]),
      makeWeek(VALID_CUID_WEEK_B, 1, [makeDay(VALID_CUID_DAY_B, VALID_CUID_WEEK_B, [])]),
    ]);

    const next = buildOptimisticDeleteDay(VALID_CUID_DAY_A)(structure);

    expect(next.plan.weeks[0]?.days).toHaveLength(0);
    expect(next.plan.weeks[1]?.days).toHaveLength(1);
    expect(next.plan.weeks[1]?.days[0]?.id).toBe(VALID_CUID_DAY_B);
  });
});

describe("buildOptimisticDeleteSession — removes session from its day", () => {
  it("filters the session and preserves siblings within the day", () => {
    const structure = makeStructure([
      makeWeek(VALID_CUID_WEEK_A, 0, [
        makeDay(VALID_CUID_DAY_A, VALID_CUID_WEEK_A, [
          makeSession(VALID_CUID_SESSION_A, VALID_CUID_DAY_A, 0),
          makeSession(VALID_CUID_SESSION_B, VALID_CUID_DAY_A, 1),
        ]),
      ]),
    ]);

    const next = buildOptimisticDeleteSession(VALID_CUID_SESSION_A)(structure);
    const day = next.plan.weeks[0]?.days[0];

    expect(day?.sessions).toHaveLength(1);
    expect(day?.sessions[0]?.id).toBe(VALID_CUID_SESSION_B);
  });

  it("does not touch days that do not contain the target session", () => {
    const structure = makeStructure([
      makeWeek(VALID_CUID_WEEK_A, 0, [
        makeDay(VALID_CUID_DAY_A, VALID_CUID_WEEK_A, [
          makeSession(VALID_CUID_SESSION_A, VALID_CUID_DAY_A, 0),
        ]),
        makeDay(VALID_CUID_DAY_B, VALID_CUID_WEEK_A, [
          makeSession(VALID_CUID_SESSION_B, VALID_CUID_DAY_B, 0),
        ]),
      ]),
    ]);

    const next = buildOptimisticDeleteSession(VALID_CUID_SESSION_A)(structure);

    expect(next.plan.weeks[0]?.days[0]?.sessions).toHaveLength(0);
    expect(next.plan.weeks[0]?.days[1]?.sessions).toHaveLength(1);
    expect(next.plan.weeks[0]?.days[1]?.sessions[0]?.id).toBe(VALID_CUID_SESSION_B);
  });
});
