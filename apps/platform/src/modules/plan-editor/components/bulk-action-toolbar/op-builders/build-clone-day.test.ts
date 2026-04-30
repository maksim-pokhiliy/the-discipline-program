import { describe, expect, it } from "vitest";

import {
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSession,
} from "@repo/contracts/lms/training-plan";

import { buildCloneDayOps, type CloneDayTarget } from "./build-clone-day";

const VALID_CUID_TARGET_SESSION = "ckxw5p7gp0000q1mnzv5cuq0a";
const VALID_CUID_TARGET_DAY = "ckxw5p7gp0000q1mnzv5cuq0b";
const VALID_CUID_SOURCE_DAY = "ckxw5p7gp0000q1mnzv5cuq0c";
const VALID_CUID_SOURCE_SESSION_A = "ckxw5p7gp0000q1mnzv5cuq0d";
const VALID_CUID_SOURCE_SESSION_B = "ckxw5p7gp0000q1mnzv5cuq0e";
const VALID_CUID_KIND = "ckxw5p7gp0000q1mnzv5cuq0f";
const VALID_CUID_WEEK = "ckxw5p7gp0000q1mnzv5cuq0g";

const makeBlock = (id: string, sessionId: string, order: number): PlanStructureBlock => ({
  id,
  sessionId,
  order,
  kindId: VALID_CUID_KIND,
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

const makeDay = (id: string, sessions: PlanStructureSession[]): PlanStructureDay => ({
  id,
  weekId: VALID_CUID_WEEK,
  dayOfWeek: "MON",
  kind: "TRAINING",
  notes: null,
  sessions,
});

describe("buildCloneDayOps — per-target order accumulator", () => {
  it("emits sequential orders starting from initial when source has 3 blocks and target has 2", () => {
    const sourceBlocks = [
      makeBlock("ckxw5p7gp0000q1mnzv5cu100", VALID_CUID_SOURCE_SESSION_A, 0),
      makeBlock("ckxw5p7gp0000q1mnzv5cu101", VALID_CUID_SOURCE_SESSION_A, 1),
      makeBlock("ckxw5p7gp0000q1mnzv5cu102", VALID_CUID_SOURCE_SESSION_A, 2),
    ];
    const source = makeDay(VALID_CUID_SOURCE_DAY, [
      makeSession(VALID_CUID_SOURCE_SESSION_A, VALID_CUID_SOURCE_DAY, sourceBlocks),
    ]);
    const targetSession = makeSession(VALID_CUID_TARGET_SESSION, VALID_CUID_TARGET_DAY, [
      makeBlock("ckxw5p7gp0000q1mnzv5cu200", VALID_CUID_TARGET_SESSION, 0),
      makeBlock("ckxw5p7gp0000q1mnzv5cu201", VALID_CUID_TARGET_SESSION, 1),
    ]);
    const target: CloneDayTarget = { dayId: VALID_CUID_TARGET_DAY, sessions: [targetSession] };

    const result = buildCloneDayOps({ source, targets: [target] });
    const ops = result.chunks.flat();
    const orders = ops.map((op) => (op.kind === "create-block" ? op.payload.order : -1));

    expect(orders).toEqual([2, 3, 4]);
  });

  it("does not collide when two source sessions clone into the same target session", () => {
    const sourceSessionA = makeSession(VALID_CUID_SOURCE_SESSION_A, VALID_CUID_SOURCE_DAY, [
      makeBlock("ckxw5p7gp0000q1mnzv5cu300", VALID_CUID_SOURCE_SESSION_A, 0),
      makeBlock("ckxw5p7gp0000q1mnzv5cu301", VALID_CUID_SOURCE_SESSION_A, 1),
      makeBlock("ckxw5p7gp0000q1mnzv5cu302", VALID_CUID_SOURCE_SESSION_A, 2),
    ]);
    const sourceSessionB = makeSession(VALID_CUID_SOURCE_SESSION_B, VALID_CUID_SOURCE_DAY, [
      makeBlock("ckxw5p7gp0000q1mnzv5cu400", VALID_CUID_SOURCE_SESSION_B, 0),
      makeBlock("ckxw5p7gp0000q1mnzv5cu401", VALID_CUID_SOURCE_SESSION_B, 1),
    ]);
    const source = makeDay(VALID_CUID_SOURCE_DAY, [sourceSessionA, sourceSessionB]);
    const targetSession = makeSession(VALID_CUID_TARGET_SESSION, VALID_CUID_TARGET_DAY, [
      makeBlock("ckxw5p7gp0000q1mnzv5cu500", VALID_CUID_TARGET_SESSION, 0),
      makeBlock("ckxw5p7gp0000q1mnzv5cu501", VALID_CUID_TARGET_SESSION, 1),
    ]);
    const target: CloneDayTarget = { dayId: VALID_CUID_TARGET_DAY, sessions: [targetSession] };

    const result = buildCloneDayOps({ source, targets: [target] });
    const ops = result.chunks.flat();
    const orders = ops.map((op) => (op.kind === "create-block" ? op.payload.order : -1));

    expect(orders).toEqual([2, 3, 4, 5, 6]);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("uses independent accumulators per target session", () => {
    const source = makeDay(VALID_CUID_SOURCE_DAY, [
      makeSession(VALID_CUID_SOURCE_SESSION_A, VALID_CUID_SOURCE_DAY, [
        makeBlock("ckxw5p7gp0000q1mnzv5cu600", VALID_CUID_SOURCE_SESSION_A, 0),
        makeBlock("ckxw5p7gp0000q1mnzv5cu601", VALID_CUID_SOURCE_SESSION_A, 1),
      ]),
    ]);
    const targetSessionA = makeSession(VALID_CUID_TARGET_SESSION, VALID_CUID_TARGET_DAY, [
      makeBlock("ckxw5p7gp0000q1mnzv5cu700", VALID_CUID_TARGET_SESSION, 0),
    ]);
    const otherTargetSessionId = "ckxw5p7gp0000q1mnzv5cu800";
    const otherTargetDayId = "ckxw5p7gp0000q1mnzv5cu801";
    const targetSessionB = makeSession(otherTargetSessionId, otherTargetDayId, []);

    const result = buildCloneDayOps({
      source,
      targets: [
        { dayId: VALID_CUID_TARGET_DAY, sessions: [targetSessionA] },
        { dayId: otherTargetDayId, sessions: [targetSessionB] },
      ],
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

    expect(ordersBySession.get(VALID_CUID_TARGET_SESSION)).toEqual([1, 2]);
    expect(ordersBySession.get(otherTargetSessionId)).toEqual([0, 1]);
  });
});
