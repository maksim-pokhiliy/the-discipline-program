import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { assertSessionDeepEqual, readSession } from "../_shared/clone-assert";
import { buildRichSubtree, cleanupRichSubtree, type RichSubtree } from "../_shared/clone-fixture";
import {
  type CloneSuiteContext,
  setupCloneSuite,
  teardownCloneSuite,
} from "../_shared/clone-suite-setup";

import { lmsSessionApi } from "./admin";

describe("lmsSessionApi.duplicate", () => {
  let ctx: CloneSuiteContext;
  let weekCounter = 0;

  const buildOn = (planId: string): Promise<RichSubtree> => {
    weekCounter += 1;

    const startDate = new Date(Date.UTC(2028, 0, 3));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    return buildRichSubtree(planId, startDate, ctx.catalog);
  };

  const firstSessionOf = async (dayId: string): Promise<string> => {
    const session = await cleanupRaw.session.findFirstOrThrow({
      where: { dayId },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return session.id;
  };

  beforeAll(async () => {
    ctx = await setupCloneSuite();
  });

  afterAll(async () => {
    await teardownCloneSuite(ctx);
  });

  it("appends a deep copy at max+10 with fresh ids + preserved catalog refs (MT-1)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstSessionOf(dayId);

    try {
      const duplicated = await lmsSessionApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      expect(duplicated.id).not.toBe(sourceId);
      expect(duplicated.order).toBe(30);

      const source = await readSession(sourceId);
      const clone = await readSession(duplicated.id);

      assertSessionDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("remaps nested SchemaGroup + RowGroup containers to fresh ids (MT-8)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstSessionOf(dayId);

    try {
      const duplicated = await lmsSessionApi.duplicate(
        ctx.owner.user.id,
        ctx.activePlanId,
        sourceId,
      );

      const source = await readSession(sourceId);
      const clone = await readSession(duplicated.id);
      const sourceGroupIds = new Set(source.blocks.flatMap((b) => b.groups).map((g) => g.id));
      const sourceRowGroupIds = new Set(
        source.blocks
          .flatMap((b) => b.schemas)
          .flatMap((s) => s.rowGroups)
          .map((g) => g.id),
      );
      const cloneSchemas = clone.blocks.flatMap((b) => b.schemas);

      expect(cloneSchemas.length).toBeGreaterThan(0);
      cloneSchemas.forEach((schema) => {
        if (schema.groupId !== null) {
          expect(sourceGroupIds.has(schema.groupId)).toBe(false);
        }

        schema.rows.forEach((row) => {
          if (row.rowGroupId !== null) {
            expect(sourceRowGroupIds.has(row.rowGroupId)).toBe(false);
          }
        });
      });

      assertSessionDeepEqual(source, clone);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("leaves the source session untouched (MT-1)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstSessionOf(dayId);
    const before = await readSession(sourceId);

    try {
      await lmsSessionApi.duplicate(ctx.owner.user.id, ctx.activePlanId, sourceId);

      const after = await readSession(sourceId);

      expect(
        after.blocks
          .flatMap((b) => b.schemas)
          .flatMap((s) => s.rows)
          .map((r) => r.id),
      ).toEqual(
        before.blocks
          .flatMap((b) => b.schemas)
          .flatMap((s) => s.rows)
          .map((r) => r.id),
      );
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a non-owner coach (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstSessionOf(dayId);

    try {
      await expect(
        lmsSessionApi.duplicate(ctx.otherCoach.user.id, ctx.activePlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects a session addressed under a foreign planId (MT-6)", async () => {
    const subtree = await buildOn(ctx.activePlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstSessionOf(dayId);

    try {
      await expect(
        lmsSessionApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(NotFoundError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });

  it("rejects an archived plan (MT-6)", async () => {
    const subtree = await buildOn(ctx.archivedPlanId);
    const dayId = subtree.dayIds[0] ?? "";
    const sourceId = await firstSessionOf(dayId);

    try {
      await expect(
        lmsSessionApi.duplicate(ctx.owner.user.id, ctx.archivedPlanId, sourceId),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(subtree.weekId);
    }
  });
});
