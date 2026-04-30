import { describe, expect, it } from "vitest";

import {
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSession,
  type PlanStructureWeek,
} from "@repo/contracts/lms/training-plan";

import { buildRepeatWeekPatternOps } from "./build-repeat-week-pattern";

const KIND = "ckxw5p7gp0000q1mnzv5cu0kd";
const PLAN_ID = "ckxw5p7gp0000q1mnzv5cu0pl";

const makeBlock = (id: string, sessionId: string, order: number): PlanStructureBlock => ({
  id,
  sessionId,
  order,
  kindId: KIND,
  title: null,
  status: "ACTIVE",
  weight: 1,
  notes: null,
  version: 1,
  segments: [],
});

const makeSession = (
  id: string,
  dayId: string,
  blocks: PlanStructureBlock[],
): PlanStructureSession => ({
  id,
  dayId,
  order: 0,
  label: null,
  notes: null,
  blocks,
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
  planId: PLAN_ID,
  index,
  label: null,
  notes: null,
  days,
});

describe("buildRepeatWeekPatternOps — per-destination-session order accumulator", () => {
  it("emits sequential orders without collisions when source week has multiple sessions on same day", () => {
    const sourceWeekId = "ckxw5p7gp0000q1mnzv5cusw1";
    const sourceDayId = "ckxw5p7gp0000q1mnzv5cusd1";
    const sourceSessionAId = "ckxw5p7gp0000q1mnzv5cusa1";
    const sourceSessionBId = "ckxw5p7gp0000q1mnzv5cusb1";

    const sourceWeek = makeWeek(sourceWeekId, 0, [
      makeDay(sourceDayId, sourceWeekId, [
        makeSession(sourceSessionAId, sourceDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0a1", sourceSessionAId, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0a2", sourceSessionAId, 1),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0a3", sourceSessionAId, 2),
        ]),
        makeSession(sourceSessionBId, sourceDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0b1", sourceSessionBId, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0b2", sourceSessionBId, 1),
        ]),
      ]),
    ]);

    const destWeekId = "ckxw5p7gp0000q1mnzv5cudw1";
    const destDayId = "ckxw5p7gp0000q1mnzv5cudd1";
    const destSessionId = "ckxw5p7gp0000q1mnzv5cuds1";
    const destinationWeek = makeWeek(destWeekId, 1, [
      makeDay(destDayId, destWeekId, [
        makeSession(destSessionId, destDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0d1", destSessionId, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0d2", destSessionId, 1),
        ]),
      ]),
    ]);

    const result = buildRepeatWeekPatternOps({
      sourceWeeks: [sourceWeek],
      destinationWeeks: [destinationWeek],
    });
    const ops = result.chunks.flat();
    const orders = ops.map((op) => (op.kind === "create-block" ? op.payload.order : -1));

    expect(orders).toEqual([2, 3, 4, 5, 6]);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("uses independent accumulators across destination weeks", () => {
    const sourceWeekId = "ckxw5p7gp0000q1mnzv5cusw2";
    const sourceDayId = "ckxw5p7gp0000q1mnzv5cusd2";
    const sourceSessionId = "ckxw5p7gp0000q1mnzv5cusa2";
    const sourceWeek = makeWeek(sourceWeekId, 0, [
      makeDay(sourceDayId, sourceWeekId, [
        makeSession(sourceSessionId, sourceDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0e1", sourceSessionId, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0e2", sourceSessionId, 1),
        ]),
      ]),
    ]);

    const destWeek1Id = "ckxw5p7gp0000q1mnzv5cuew1";
    const destWeek2Id = "ckxw5p7gp0000q1mnzv5cuew2";
    const destDay1Id = "ckxw5p7gp0000q1mnzv5cued1";
    const destDay2Id = "ckxw5p7gp0000q1mnzv5cued2";
    const destSession1Id = "ckxw5p7gp0000q1mnzv5cues1";
    const destSession2Id = "ckxw5p7gp0000q1mnzv5cues2";

    const destWeek1 = makeWeek(destWeek1Id, 1, [
      makeDay(destDay1Id, destWeek1Id, [makeSession(destSession1Id, destDay1Id, [])]),
    ]);
    const destWeek2 = makeWeek(destWeek2Id, 2, [
      makeDay(destDay2Id, destWeek2Id, [makeSession(destSession2Id, destDay2Id, [])]),
    ]);

    const result = buildRepeatWeekPatternOps({
      sourceWeeks: [sourceWeek],
      destinationWeeks: [destWeek1, destWeek2],
    });
    const ops = result.chunks.flat();
    const ordersBySession = new Map<string, number[]>();

    for (const op of ops) {
      if (op.kind !== "create-block") {
        continue;
      }

      const list = ordersBySession.get(op.sessionId) ?? [];

      list.push(op.payload.order);
      ordersBySession.set(op.sessionId, list);
    }

    expect(ordersBySession.get(destSession1Id)).toEqual([0, 1]);
    expect(ordersBySession.get(destSession2Id)).toEqual([0, 1]);
  });
});
