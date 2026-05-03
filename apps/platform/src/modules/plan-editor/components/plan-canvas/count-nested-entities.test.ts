import { describe, expect, it } from "vitest";

import {
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSession,
  type PlanStructureWeek,
} from "@repo/contracts/lms/training-plan";

import {
  countDayEntities,
  countSessionEntities,
  countWeekEntities,
  isContainerEmpty,
} from "./count-nested-entities";

const buildBlock = (id: string): PlanStructureBlock => ({
  id,
  sessionId: "ckxw5p7gp0000q1mnzv5cuq01",
  order: 0,
  kindId: "ckxw5p7gp0000q1mnzv5cuq02",
  title: null,
  status: "ACTIVE",
  weight: 1,
  notes: null,
  version: 1,
  segments: [],
});

const buildSession = (id: string, blocks: PlanStructureBlock[]): PlanStructureSession => ({
  id,
  dayId: "ckxw5p7gp0000q1mnzv5cuq03",
  order: 0,
  label: null,
  notes: null,
  version: 1,
  blocks,
});

const buildDay = (id: string, sessions: PlanStructureSession[]): PlanStructureDay => ({
  id,
  weekId: "ckxw5p7gp0000q1mnzv5cuq04",
  dayOfWeek: "MON",
  kind: "TRAINING",
  notes: null,
  version: 1,
  sessions,
});

const buildWeek = (id: string, days: PlanStructureDay[]): PlanStructureWeek => ({
  id,
  planId: "ckxw5p7gp0000q1mnzv5cuq05",
  index: 0,
  label: null,
  notes: null,
  version: 1,
  days,
});

describe("countSessionEntities (MT-11)", () => {
  it("returns blocks count for a session with no blocks", () => {
    const session = buildSession("s1", []);

    expect(countSessionEntities(session)).toEqual({ blocks: 0 });
  });

  it("returns the number of blocks attached to the session", () => {
    const session = buildSession("s1", [buildBlock("b1"), buildBlock("b2"), buildBlock("b3")]);

    expect(countSessionEntities(session)).toEqual({ blocks: 3 });
  });

  it("does not include sessions key (CODE-002 regression — sessions is week/day-only)", () => {
    const session = buildSession("s1", [buildBlock("b1")]);
    const counts = countSessionEntities(session);

    expect("sessions" in counts).toBe(false);
  });
});

describe("countDayEntities (MT-11)", () => {
  it("returns sessions=0 and blocks=0 for an empty day", () => {
    const day = buildDay("d1", []);

    expect(countDayEntities(day)).toEqual({ sessions: 0, blocks: 0 });
  });

  it("counts sessions and aggregates blocks across them", () => {
    const day = buildDay("d1", [
      buildSession("s1", [buildBlock("b1"), buildBlock("b2")]),
      buildSession("s2", [buildBlock("b3")]),
    ]);

    expect(countDayEntities(day)).toEqual({ sessions: 2, blocks: 3 });
  });

  it("returns sessions count even when sessions have zero blocks", () => {
    const day = buildDay("d1", [buildSession("s1", []), buildSession("s2", [])]);

    expect(countDayEntities(day)).toEqual({ sessions: 2, blocks: 0 });
  });
});

describe("countWeekEntities (MT-11)", () => {
  it("returns sessions=0 and blocks=0 for a week with empty days", () => {
    const week = buildWeek("w1", [
      buildDay("d1", []),
      buildDay("d2", []),
      buildDay("d3", []),
      buildDay("d4", []),
      buildDay("d5", []),
      buildDay("d6", []),
      buildDay("d7", []),
    ]);

    expect(countWeekEntities(week)).toEqual({ sessions: 0, blocks: 0 });
  });

  it("aggregates session counts and block counts across all days", () => {
    const week = buildWeek("w1", [
      buildDay("d1", [
        buildSession("s1", [buildBlock("b1"), buildBlock("b2")]),
        buildSession("s2", [buildBlock("b3")]),
      ]),
      buildDay("d2", [buildSession("s3", [buildBlock("b4"), buildBlock("b5")])]),
    ]);

    expect(countWeekEntities(week)).toEqual({ sessions: 3, blocks: 5 });
  });

  it("does not include a days key (CODE-002 regression — week counts surface sessions+blocks only)", () => {
    const week = buildWeek("w1", [buildDay("d1", [buildSession("s1", [buildBlock("b1")])])]);
    const counts = countWeekEntities(week);

    expect("days" in counts).toBe(false);
    expect(counts).toEqual({ sessions: 1, blocks: 1 });
  });
});

describe("isContainerEmpty (MT-11)", () => {
  it("returns true for an empty counts object", () => {
    expect(isContainerEmpty({})).toBe(true);
  });

  it("returns true when sessions and blocks are both zero", () => {
    expect(isContainerEmpty({ sessions: 0, blocks: 0 })).toBe(true);
  });

  it("returns true when only blocks is set to zero", () => {
    expect(isContainerEmpty({ blocks: 0 })).toBe(true);
  });

  it("returns true when only sessions is set to zero", () => {
    expect(isContainerEmpty({ sessions: 0 })).toBe(true);
  });

  it("returns false when sessions is non-zero", () => {
    expect(isContainerEmpty({ sessions: 1 })).toBe(false);
  });

  it("returns false when blocks is non-zero", () => {
    expect(isContainerEmpty({ blocks: 1 })).toBe(false);
  });

  it("returns false when both sessions and blocks are non-zero", () => {
    expect(isContainerEmpty({ sessions: 2, blocks: 4 })).toBe(false);
  });
});
