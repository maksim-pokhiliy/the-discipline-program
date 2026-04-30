import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanup, cleanupRaw } from "../../test/helpers";

import { resolveEffectivePlan } from "./plan-override-resolver";
import {
  buildResolverFixture,
  COUNT_DOWN_PARAMS,
  makeBlockSnapshot,
  type ResolverFixture,
} from "./plan-override-resolver.fixtures";

describe("resolveEffectivePlan — ordering, fake scope, week-window (integration)", () => {
  let fx: ResolverFixture;

  beforeAll(async () => {
    fx = await buildResolverFixture();
  });

  afterAll(async () => {
    await cleanupRaw.planOverride.deleteMany({ where: { enrollmentId: fx.enrollmentId } });
    await cleanup(...fx.toCleanup);
  });

  it("two REPLACE overrides on same scopeId — last wins, node is still isOverridden", async () => {
    const baseSnapshot = makeBlockSnapshot(fx.blockId, fx.sessionId, fx.blockKindId) as Record<
      string,
      unknown
    >;

    const first = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "REPLACE",
        payload: {
          kind: "REPLACE",
          snapshot: { ...baseSnapshot, title: "first snapshot" },
        } as Prisma.InputJsonValue,
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    });

    const second = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "REPLACE",
        payload: {
          kind: "REPLACE",
          snapshot: { ...baseSnapshot, title: "second snapshot" },
        } as Prisma.InputJsonValue,
        createdAt: new Date("2026-02-02T00:00:00.000Z"),
      },
    });

    const result = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 0,
    });
    const block = result.days[0]?.sessions[0]?.blocks[0];

    expect(block?.isOverridden).toBe(true);
    expect(block?.overrideKind).toBe("REPLACE");

    const overrides = await cleanupRaw.planOverride.findMany({
      where: { enrollmentId: fx.enrollmentId, scopeId: fx.blockId, kind: "REPLACE" },
      orderBy: [{ createdAt: "asc" }],
    });

    expect(overrides).toHaveLength(2);

    const lastPayload = overrides[1]?.payload as Record<string, unknown>;

    expect((lastPayload["snapshot"] as Record<string, unknown>)["title"]).toBe("second snapshot");

    await cleanupRaw.planOverride.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
  });

  it("override on non-matching scopeId — no node marked isOverridden", async () => {
    const fakeScopeId = `c${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const override = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fakeScopeId,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "should not appear" } as Prisma.InputJsonValue,
      },
    });

    const result = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 0,
    });
    const allBlocks = result.days.flatMap((d) => d.sessions.flatMap((s) => s.blocks));

    expect(allBlocks.every((b) => !b.isOverridden)).toBe(true);

    await cleanupRaw.planOverride.delete({ where: { id: override.id } });
  });

  it("week-window: override outside range → not applied; inside range → applied", async () => {
    const outsideOverride = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "windowed note" } as Prisma.InputJsonValue,
        startsOnWeekIndex: 1,
        endsOnWeekIndex: 3,
      },
    });

    const outsideResult = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 0,
    });
    const blockOutside = outsideResult.days[0]?.sessions[0]?.blocks[0];

    expect(blockOutside?.isOverridden).toBe(false);

    const insideWeek = await cleanupRaw.week.create({ data: { planId: fx.planId, index: 2 } });
    const insideDay = await cleanupRaw.day.create({
      data: { weekId: insideWeek.id, dayOfWeek: "MON" },
    });
    const insideSession = await cleanupRaw.lmsSession.create({
      data: { dayId: insideDay.id, order: 0 },
    });
    const insideBlock = await cleanupRaw.block.create({
      data: { sessionId: insideSession.id, order: 0, kindId: fx.blockKindId, weight: 1 },
    });

    await cleanupRaw.blockSegment.create({
      data: {
        blockId: insideBlock.id,
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: COUNT_DOWN_PARAMS,
      },
    });

    const insideOverride = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: insideBlock.id,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "windowed note inside" } as Prisma.InputJsonValue,
        startsOnWeekIndex: 1,
        endsOnWeekIndex: 3,
      },
    });

    const insideResult = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 2,
    });
    const blockInside = insideResult.days[0]?.sessions[0]?.blocks[0];

    expect(blockInside?.isOverridden).toBe(true);
    expect(blockInside?.notes[0]).toBe("windowed note inside");

    await cleanupRaw.planOverride.deleteMany({
      where: { id: { in: [outsideOverride.id, insideOverride.id] } },
    });
  });
});
