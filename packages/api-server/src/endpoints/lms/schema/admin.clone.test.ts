import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { assertSchemaDeepEqual, readSchema } from "../_shared/clone-assert";
import { buildRichSubtree, cleanupRichSubtree, type RichSubtree } from "../_shared/clone-fixture";
import {
  type CloneSuiteContext,
  setupCloneSuite,
  teardownCloneSuite,
} from "../_shared/clone-suite-setup";

import { lmsSchemaApi } from "./admin";

describe("lmsSchemaApi.duplicate", () => {
  let ctx: CloneSuiteContext;
  let weekCounter = 0;

  const buildOn = (planId: string): Promise<RichSubtree> => {
    weekCounter += 1;

    const startDate = new Date(Date.UTC(2030, 0, 7));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    return buildRichSubtree(planId, startDate, ctx.catalog);
  };

  const firstBlockOf = async (dayId: string): Promise<string> => {
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

    return block.id;
  };

  const groupedSchemaOf = async (blockId: string): Promise<string> => {
    const schema = await cleanupRaw.schema.findFirstOrThrow({
      where: { blockId, groupId: { not: null } },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return schema.id;
  };

  const ungroupedSchemaOf = async (blockId: string): Promise<string> => {
    const schema = await cleanupRaw.schema.findFirstOrThrow({
      where: { blockId, groupId: null },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return schema.id;
  };

  beforeAll(async () => {
    ctx = await setupCloneSuite();
  });

  afterAll(async () => {
    await teardownCloneSuite(ctx);
  });

  it("tail-appends an ungrouped schema with fresh inner rowGroups (MT-7)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await ungroupedSchemaOf(blockId);

    try {
      const duplicated = await lmsSchemaApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      expect(duplicated.id).not.toBe(sourceId);
      expect(duplicated.groupId).toBeNull();
      expect(duplicated.order).toBe(40);

      const source = await readSchema(sourceId);
      const clone = await readSchema(duplicated.id);
      const sourceRowGroupIds = new Set(source.rowGroups.map((g) => g.id));

      clone.rows.forEach((row) => {
        if (row.rowGroupId !== null) {
          expect(sourceRowGroupIds.has(row.rowGroupId)).toBe(false);
        }
      });

      assertSchemaDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("appends a grouped schema into the SAME group after the last member, keeping contiguity (MT-7)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedSchemaOf(blockId);
    const source = await cleanupRaw.schema.findUniqueOrThrow({
      where: { id: sourceId },
      select: { groupId: true },
    });

    try {
      const duplicated = await lmsSchemaApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      expect(duplicated.groupId).toBe(source.groupId);
      expect(duplicated.order).toBe(30);

      const blockSchemas = await cleanupRaw.schema.findMany({
        where: { blockId },
        orderBy: { order: "asc" },
        select: { id: true, order: true, groupId: true },
      });
      const memberOrders = blockSchemas
        .filter((s) => s.groupId === source.groupId)
        .map((s) => s.order);

      expect(memberOrders).toEqual([10, 20, 30]);
      expect(blockSchemas.map((s) => s.order)).toEqual([10, 20, 30, 40]);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("deep-copies the grouped schema body with preserved catalog refs (MT-1)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedSchemaOf(blockId);

    try {
      const duplicated = await lmsSchemaApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      const source = await readSchema(sourceId);
      const clone = await readSchema(duplicated.id);

      assertSchemaDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("never leaves the group non-contiguous or double-ordered under concurrent duplicate (MT-10)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await groupedSchemaOf(blockId);
    const source = await cleanupRaw.schema.findUniqueOrThrow({
      where: { id: sourceId },
      select: { groupId: true },
    });

    try {
      const results = await Promise.allSettled([
        lmsSchemaApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId),
        lmsSchemaApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId),
      ]);

      expect(results.some((r) => r.status === "fulfilled")).toBe(true);

      const blockSchemas = await cleanupRaw.schema.findMany({
        where: { blockId },
        orderBy: { order: "asc" },
        select: { order: true, groupId: true },
      });
      const orders = blockSchemas.map((s) => s.order);
      const memberIndices = blockSchemas
        .map((s, index) => ({ index, isMember: s.groupId === source.groupId }))
        .filter((entry) => entry.isMember)
        .map((entry) => entry.index);
      const span = (memberIndices.at(-1) ?? 0) - (memberIndices[0] ?? 0) + 1;

      expect(new Set(orders).size).toBe(orders.length);
      expect(span).toBe(memberIndices.length);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a non-owner coach (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await ungroupedSchemaOf(blockId);

    try {
      await expect(
        lmsSchemaApi.duplicate(ctx.otherCoach.user.id, ctx.activePlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a schema addressed under a foreign planId (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await ungroupedSchemaOf(blockId);

    try {
      await expect(
        lmsSchemaApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(NotFoundError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects an archived plan (MT-6)", async () => {
    const subtree = await buildOn(ctx.archivedPlanId);
    const blockId = await firstBlockOf(subtree.dayIds[0] ?? "");
    const sourceId = await ungroupedSchemaOf(blockId);

    try {
      await expect(
        lmsSchemaApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });
});
