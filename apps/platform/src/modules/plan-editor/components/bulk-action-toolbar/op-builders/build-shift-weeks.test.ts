import { describe, expect, it } from "vitest";

import {
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSession,
  type PlanStructureWeek,
} from "@repo/contracts/lms/training-plan";

import { buildShiftWeeksOps } from "./build-shift-weeks";

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
  version: 1,
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
  version: 1,
  sessions,
});

const makeWeek = (id: string, index: number, days: PlanStructureDay[]): PlanStructureWeek => ({
  id,
  planId: PLAN_ID,
  index,
  label: null,
  notes: null,
  version: 1,
  days,
});

describe("buildShiftWeeksOps — per-destination-session order accumulator", () => {
  it("emits sequential targetOrders without collisions when shifting blocks from multiple sessions", () => {
    const srcWeekId = "ckxw5p7gp0000q1mnzv5cusw3";
    const srcDayId = "ckxw5p7gp0000q1mnzv5cusd3";
    const srcSessionAId = "ckxw5p7gp0000q1mnzv5cusa3";
    const srcSessionBId = "ckxw5p7gp0000q1mnzv5cusb3";

    const sourceWeek = makeWeek(srcWeekId, 0, [
      makeDay(srcDayId, srcWeekId, [
        makeSession(srcSessionAId, srcDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0f1", srcSessionAId, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0f2", srcSessionAId, 1),
        ]),
        makeSession(srcSessionBId, srcDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0g1", srcSessionBId, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0g2", srcSessionBId, 1),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0g3", srcSessionBId, 2),
        ]),
      ]),
    ]);

    const dstWeekId = "ckxw5p7gp0000q1mnzv5cudw3";
    const dstDayId = "ckxw5p7gp0000q1mnzv5cudd3";
    const dstSessionId = "ckxw5p7gp0000q1mnzv5cuds3";
    const destinationWeek = makeWeek(dstWeekId, 2, [
      makeDay(dstDayId, dstWeekId, [
        makeSession(dstSessionId, dstDayId, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0h1", dstSessionId, 0),
        ]),
      ]),
    ]);

    const result = buildShiftWeeksOps({
      weeks: [sourceWeek],
      destinationWeeks: [sourceWeek, destinationWeek],
      delta: 2,
    });
    const ops = result.chunks.flat();
    const orders = ops.map((op) => (op.kind === "move-block" ? op.targetOrder : -1));

    expect(orders).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("uses independent accumulators across destination sessions", () => {
    const srcWeek1Id = "ckxw5p7gp0000q1mnzv5cusw4";
    const srcWeek2Id = "ckxw5p7gp0000q1mnzv5cusw5";
    const srcDay1Id = "ckxw5p7gp0000q1mnzv5cusd4";
    const srcDay2Id = "ckxw5p7gp0000q1mnzv5cusd5";
    const srcSession1Id = "ckxw5p7gp0000q1mnzv5cusa4";
    const srcSession2Id = "ckxw5p7gp0000q1mnzv5cusa5";

    const srcWeek1 = makeWeek(srcWeek1Id, 0, [
      makeDay(srcDay1Id, srcWeek1Id, [
        makeSession(srcSession1Id, srcDay1Id, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0i1", srcSession1Id, 0),
          makeBlock("ckxw5p7gp0000q1mnzv5cu0i2", srcSession1Id, 1),
        ]),
      ]),
    ]);
    const srcWeek2 = makeWeek(srcWeek2Id, 1, [
      makeDay(srcDay2Id, srcWeek2Id, [
        makeSession(srcSession2Id, srcDay2Id, [
          makeBlock("ckxw5p7gp0000q1mnzv5cu0j1", srcSession2Id, 0),
        ]),
      ]),
    ]);

    const dstWeek1Id = "ckxw5p7gp0000q1mnzv5cudw4";
    const dstWeek2Id = "ckxw5p7gp0000q1mnzv5cudw5";
    const dstDay1Id = "ckxw5p7gp0000q1mnzv5cudd4";
    const dstDay2Id = "ckxw5p7gp0000q1mnzv5cudd5";
    const dstSession1Id = "ckxw5p7gp0000q1mnzv5cuds4";
    const dstSession2Id = "ckxw5p7gp0000q1mnzv5cuds5";

    const dstWeek1 = makeWeek(dstWeek1Id, 2, [
      makeDay(dstDay1Id, dstWeek1Id, [makeSession(dstSession1Id, dstDay1Id, [])]),
    ]);
    const dstWeek2 = makeWeek(dstWeek2Id, 3, [
      makeDay(dstDay2Id, dstWeek2Id, [makeSession(dstSession2Id, dstDay2Id, [])]),
    ]);

    const result = buildShiftWeeksOps({
      weeks: [srcWeek1, srcWeek2],
      destinationWeeks: [dstWeek1, dstWeek2],
      delta: 2,
    });
    const ops = result.chunks.flat();
    const ordersBySession = new Map<string, number[]>();

    for (const op of ops) {
      if (op.kind !== "move-block") {
        continue;
      }

      const list = ordersBySession.get(op.targetSessionId) ?? [];

      list.push(op.targetOrder);
      ordersBySession.set(op.targetSessionId, list);
    }

    expect(ordersBySession.get(dstSession1Id)).toEqual([0, 1]);
    expect(ordersBySession.get(dstSession2Id)).toEqual([0]);
  });
});
