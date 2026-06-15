import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { assertRowDeepEqual, readRow } from "../_shared/clone-assert";
import { buildRichSubtree, cleanupRichSubtree, type RichSubtree } from "../_shared/clone-fixture";
import {
  type CloneSuiteContext,
  setupCloneSuite,
  teardownCloneSuite,
} from "../_shared/clone-suite-setup";

import { lmsSchemaRowApi } from "./admin";

describe("lmsSchemaRowApi.duplicate", () => {
  let ctx: CloneSuiteContext;
  let weekCounter = 0;

  const buildOn = (planId: string): Promise<RichSubtree> => {
    weekCounter += 1;

    const startDate = new Date(Date.UTC(2031, 0, 6));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    return buildRichSubtree(planId, startDate, ctx.catalog);
  };

  const firstSchemaOf = async (dayId: string): Promise<string> => {
    const session = await cleanupRaw.session.findFirstOrThrow({
      where: { dayId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const block = await cleanupRaw.block.findFirstOrThrow({
      where: { sessionId: session.id },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const schema = await cleanupRaw.schema.findFirstOrThrow({
      where: { blockId: block.id },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return schema.id;
  };

  const groupedRowOf = async (schemaId: string): Promise<string> => {
    const row = await cleanupRaw.schemaRow.findFirstOrThrow({
      where: { schemaId, rowGroupId: { not: null } },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return row.id;
  };

  const nullVoRowOf = async (schemaId: string): Promise<string> => {
    const row = await cleanupRaw.schemaRow.findFirstOrThrow({
      where: { schemaId, rowGroupId: null },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return row.id;
  };

  beforeAll(async () => {
    ctx = await setupCloneSuite();
  });

  afterAll(async () => {
    await teardownCloneSuite(ctx);
  });

  it("appends a grouped row into the SAME rowGroup after the last member, keeping contiguity (MT-7)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedRowOf(schemaId);
    const source = await cleanupRaw.schemaRow.findUniqueOrThrow({
      where: { id: sourceId },
      select: { rowGroupId: true },
    });

    try {
      const duplicated = await lmsSchemaRowApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      expect(duplicated.rowGroupId).toBe(source.rowGroupId);
      expect(duplicated.order).toBe(30);

      const schemaRows = await cleanupRaw.schemaRow.findMany({
        where: { schemaId },
        orderBy: { order: "asc" },
        select: { order: true, rowGroupId: true },
      });
      const memberOrders = schemaRows
        .filter((r) => r.rowGroupId === source.rowGroupId)
        .map((r) => r.order);

      expect(memberOrders).toEqual([10, 20, 30]);
      expect(schemaRows.map((r) => r.order)).toEqual([10, 20, 30, 40]);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("preserves modifier refs + order and copies every populated VO (MT-12 / MT-13)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedRowOf(schemaId);

    try {
      const duplicated = await lmsSchemaRowApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      const source = await readRow(sourceId);
      const clone = await readRow(duplicated.id);

      expect(clone.modifierAssignments.map((a) => a.modifierId)).toEqual([
        ctx.catalog.modifierAId,
        ctx.catalog.modifierBId,
      ]);
      expect(clone.modifierAssignments.map((a) => a.order)).toEqual([0, 1]);

      assertRowDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("never leaves the rowGroup non-contiguous or double-ordered under concurrent duplicate (MT-10)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedRowOf(schemaId);
    const source = await cleanupRaw.schemaRow.findUniqueOrThrow({
      where: { id: sourceId },
      select: { rowGroupId: true },
    });

    try {
      const results = await Promise.allSettled([
        lmsSchemaRowApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId),
        lmsSchemaRowApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId),
      ]);

      expect(results.some((r) => r.status === "fulfilled")).toBe(true);

      const schemaRows = await cleanupRaw.schemaRow.findMany({
        where: { schemaId },
        orderBy: { order: "asc" },
        select: { order: true, rowGroupId: true },
      });
      const orders = schemaRows.map((r) => r.order);
      const memberIndices = schemaRows
        .map((r, index) => ({ index, isMember: r.rowGroupId === source.rowGroupId }))
        .filter((entry) => entry.isMember)
        .map((entry) => entry.index);
      const span = (memberIndices.at(-1) ?? 0) - (memberIndices[0] ?? 0) + 1;

      expect(new Set(orders).size).toBe(orders.length);
      expect(span).toBe(memberIndices.length);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("tail-appends an all-null-VO row preserving the JSON null branch (MT-13)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await nullVoRowOf(schemaId);

    try {
      const duplicated = await lmsSchemaRowApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      expect(duplicated.rowGroupId).toBeNull();
      expect(duplicated.order).toBe(40);

      const clone = await readRow(duplicated.id);

      expect(clone.load).toBeNull();
      expect(clone.reps).toBeNull();
      expect(clone.side).toBeNull();
      expect(clone.tempo).toBeNull();
      expect(clone.media).toBeNull();
      expect(clone.notes).toBeNull();
      expect(clone.sets).toBeNull();
      expect(clone.exerciseId).toBe(ctx.catalog.exerciseId);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("adds zero exercise / modifier / label rows when duplicating (MT-12)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedRowOf(schemaId);
    const before = {
      exercises: await cleanupRaw.exercise.count(),
      modifiers: await cleanupRaw.modifier.count(),
      labels: await cleanupRaw.label.count(),
    };

    try {
      await lmsSchemaRowApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId);

      expect(await cleanupRaw.exercise.count()).toBe(before.exercises);
      expect(await cleanupRaw.modifier.count()).toBe(before.modifiers);
      expect(await cleanupRaw.label.count()).toBe(before.labels);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a non-owner coach (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await nullVoRowOf(schemaId);

    try {
      await expect(
        lmsSchemaRowApi.duplicate(ctx.otherCoach.user.id, ctx.activePlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a row addressed under a foreign planId (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await nullVoRowOf(schemaId);

    try {
      await expect(
        lmsSchemaRowApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(NotFoundError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects an archived plan (MT-6)", async () => {
    const subtree = await buildOn(ctx.archivedPlanId);
    const schemaId = await firstSchemaOf(subtree.dayIds[0] ?? "");
    const sourceId = await nullVoRowOf(schemaId);

    try {
      await expect(
        lmsSchemaRowApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });
});
