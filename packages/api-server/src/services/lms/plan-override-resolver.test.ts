import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanup, cleanupRaw } from "../../test/helpers";

import { resolveEffectivePlan } from "./plan-override-resolver";
import {
  buildResolverFixture,
  makeBlockSnapshot,
  makeEntrySnapshot,
  type ResolverFixture,
} from "./plan-override-resolver.fixtures";

describe("resolveEffectivePlan — REPLACE / APPEND / SUSPEND / NOTE (integration)", () => {
  let fx: ResolverFixture;

  beforeAll(async () => {
    fx = await buildResolverFixture();
  });

  afterAll(async () => {
    await cleanupRaw.planOverride.deleteMany({ where: { enrollmentId: fx.enrollmentId } });
    await cleanup(...fx.toCleanup);
  });

  it("REPLACE on a block node marks it isOverridden with overrideKind REPLACE", async () => {
    const override = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "REPLACE",
        payload: {
          kind: "REPLACE",
          snapshot: makeBlockSnapshot(fx.blockId, fx.sessionId, fx.blockKindId),
        } as Prisma.InputJsonValue,
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
    expect(block?.suspended).toBe(false);

    await cleanupRaw.planOverride.delete({ where: { id: override.id } });
  });

  it("APPEND adds entries to a segment", async () => {
    const newEntryId = `c${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const newSetGroupId = `c${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const override = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK_SEGMENT",
        scopeId: fx.segmentId,
        kind: "APPEND",
        payload: {
          kind: "APPEND",
          entries: [makeEntrySnapshot(newEntryId, newSetGroupId, fx.exerciseId)],
        } as Prisma.InputJsonValue,
      },
    });

    const result = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 0,
    });
    const seg = result.days[0]?.sessions[0]?.blocks[0]?.segments[0];

    expect(seg?.isOverridden).toBe(true);
    expect(seg?.overrideKind).toBe("APPEND");
    expect(seg?.entries).toHaveLength(2);
    expect(seg?.entries[1]?.id).toBe(newEntryId);

    await cleanupRaw.planOverride.delete({ where: { id: override.id } });
  });

  it("SUSPEND marks block suspended and ignores subsequent REPLACE on same node", async () => {
    const suspendOverride = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "SUSPEND",
        payload: { kind: "SUSPEND" } as Prisma.InputJsonValue,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });

    const replaceOverride = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "REPLACE",
        payload: {
          kind: "REPLACE",
          snapshot: makeBlockSnapshot(fx.blockId, fx.sessionId, fx.blockKindId),
        } as Prisma.InputJsonValue,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });

    const result = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 0,
    });
    const block = result.days[0]?.sessions[0]?.blocks[0];

    expect(block?.suspended).toBe(true);
    expect(block?.overrideKind).toBe("SUSPEND");

    await cleanupRaw.planOverride.deleteMany({
      where: { id: { in: [suspendOverride.id, replaceOverride.id] } },
    });
  });

  it("NOTE accumulates markdown from two overrides", async () => {
    const note1 = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "# First note" } as Prisma.InputJsonValue,
      },
    });

    const note2 = await cleanupRaw.planOverride.create({
      data: {
        enrollmentId: fx.enrollmentId,
        scope: "BLOCK",
        scopeId: fx.blockId,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "# Second note" } as Prisma.InputJsonValue,
      },
    });

    const result = await resolveEffectivePlan({
      db: cleanupRaw,
      enrollmentId: fx.enrollmentId,
      weekIndex: 0,
    });
    const block = result.days[0]?.sessions[0]?.blocks[0];

    expect(block?.notes).toHaveLength(2);
    expect(block?.notes).toContain("# First note");
    expect(block?.notes).toContain("# Second note");

    await cleanupRaw.planOverride.deleteMany({
      where: { id: { in: [note1.id, note2.id] } },
    });
  });
});
