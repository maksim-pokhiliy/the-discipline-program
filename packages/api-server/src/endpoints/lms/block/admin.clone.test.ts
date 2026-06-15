import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { assertBlockDeepEqual, readBlock } from "../_shared/clone-assert";
import { buildRichSubtree, cleanupRichSubtree, type RichSubtree } from "../_shared/clone-fixture";
import {
  type CloneSuiteContext,
  setupCloneSuite,
  teardownCloneSuite,
} from "../_shared/clone-suite-setup";

import { lmsBlockApi } from "./admin";

describe("lmsBlockApi.duplicate", () => {
  let ctx: CloneSuiteContext;
  let weekCounter = 0;

  const buildOn = (planId: string): Promise<RichSubtree> => {
    weekCounter += 1;

    const startDate = new Date(Date.UTC(2029, 0, 1));

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

  beforeAll(async () => {
    ctx = await setupCloneSuite();
  });

  afterAll(async () => {
    await teardownCloneSuite(ctx);
  });

  it("appends a deep copy at max+10 with label refs + fresh ids (MT-1)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstBlockOf(dayId);

    try {
      const duplicated = await lmsBlockApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId);

      expect(duplicated.id).not.toBe(sourceId);
      expect(duplicated.order).toBe(30);
      expect(duplicated.labels.map((l) => l.id)).toEqual([ctx.catalog.blockLabelId]);

      const source = await readBlock(sourceId);
      const clone = await readBlock(duplicated.id);

      assertBlockDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("remaps the nested SchemaGroup + RowGroup containers to fresh ids (MT-8)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstBlockOf(dayId);

    try {
      const duplicated = await lmsBlockApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId);

      const source = await readBlock(sourceId);
      const clone = await readBlock(duplicated.id);
      const sourceGroupIds = new Set(source.groups.map((g) => g.id));
      const sourceRowGroupIds = new Set(
        source.schemas.flatMap((s) => s.rowGroups).map((g) => g.id),
      );

      expect(clone.groups.length).toBeGreaterThan(0);
      clone.groups.forEach((group) => expect(sourceGroupIds.has(group.id)).toBe(false));
      clone.schemas.forEach((schema) => {
        if (schema.groupId !== null) {
          expect(sourceGroupIds.has(schema.groupId)).toBe(false);
        }

        schema.rows.forEach((row) => {
          if (row.rowGroupId !== null) {
            expect(sourceRowGroupIds.has(row.rowGroupId)).toBe(false);
          }
        });
      });

      assertBlockDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a non-owner coach (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstBlockOf(dayId);

    try {
      await expect(
        lmsBlockApi.duplicate(ctx.otherCoach.user.id, ctx.activePlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a block addressed under a foreign planId (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstBlockOf(dayId);

    try {
      await expect(
        lmsBlockApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(NotFoundError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects an archived plan (MT-6)", async () => {
    const subtree = await buildOn(ctx.archivedPlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstBlockOf(dayId);

    try {
      await expect(
        lmsBlockApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });
});
