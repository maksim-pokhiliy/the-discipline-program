import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { assertDaysDeepEqual, type ReadDay, readDaysForWeek } from "../_shared/clone-assert";
import { buildRichSubtree, cleanupRichSubtree } from "../_shared/clone-fixture";
import {
  type CloneSuiteContext,
  setupCloneSuite,
  teardownCloneSuite,
} from "../_shared/clone-suite-setup";

import { lmsWeekApi } from "./admin";

const dateParam = (offsetWeeks: number): string => {
  const date = new Date(Date.UTC(2026, 0, 5));

  date.setUTCDate(date.getUTCDate() + offsetWeeks * 7);

  return date.toISOString().slice(0, 10);
};

const startDateOf = (param: string): Date => {
  const monday = new Date(`${param}T00:00:00.000Z`);

  return new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
};

const sessionIds = (days: ReadDay[]): string[] =>
  days.flatMap((day) => day.sessions.map((s) => s.id));

const rowCount = (days: ReadDay[]): number =>
  days
    .flatMap((day) => day.sessions)
    .flatMap((session) => session.blocks)
    .flatMap((block) => block.schemas)
    .flatMap((schema) => schema.rows).length;

describe("lmsWeekApi.cloneFrom", () => {
  let ctx: CloneSuiteContext;
  let weekCounter = 0;

  const nextParam = (): string => {
    weekCounter += 1;

    return dateParam(weekCounter * 3);
  };

  const targetWeekId = async (param: string): Promise<string> => {
    const week = await cleanupRaw.week.findUniqueOrThrow({
      where: { planId_startDate: { planId: ctx.activePlanId, startDate: startDateOf(param) } },
    });

    return week.id;
  };

  beforeAll(async () => {
    ctx = await setupCloneSuite();
  });

  afterAll(async () => {
    await teardownCloneSuite(ctx);
  });

  it("deep round-trips a rich week into an empty target with fresh ids + preserved catalog refs (MT-1)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sourceParam), ctx.catalog);

    try {
      const result = await lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, {
        sourceStartDate: sourceParam,
      });

      expect(result.cloned).toBe(true);

      const targetId = await targetWeekId(targetParam);
      const targetWeek = await cleanupRaw.week.findUniqueOrThrow({ where: { id: targetId } });

      expect(targetWeek.notes).toEqual(["week note"]);

      assertDaysDeepEqual(await readDaysForWeek(source.weekId), await readDaysForWeek(targetId));
    } finally {
      await cleanupRichSubtree(source.weekId);
      await cleanupRichSubtree(await targetWeekId(targetParam));
    }
  });

  it("leaves the source week untouched after cloning (MT-1)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sourceParam), ctx.catalog);
    const before = await readDaysForWeek(source.weekId);

    try {
      await lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, {
        sourceStartDate: sourceParam,
      });

      expect(sessionIds(await readDaysForWeek(source.weekId))).toEqual(sessionIds(before));
    } finally {
      await cleanupRichSubtree(source.weekId);
      await cleanupRichSubtree(await targetWeekId(targetParam));
    }
  });

  it("replaces an existing target subtree and holds the schemas_block_order unique (MT-4)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sourceParam), ctx.catalog);
    const target = await buildRichSubtree(ctx.activePlanId, startDateOf(targetParam), ctx.catalog);
    const stalePre = sessionIds(await readDaysForWeek(target.weekId));

    try {
      const result = await lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, {
        sourceStartDate: sourceParam,
      });

      expect(result.cloned).toBe(true);

      const staleStillThere = await cleanupRaw.session.findMany({
        where: { id: { in: stalePre } },
        select: { id: true },
      });

      expect(staleStillThere).toHaveLength(0);

      assertDaysDeepEqual(
        await readDaysForWeek(source.weekId),
        await readDaysForWeek(target.weekId),
      );
    } finally {
      await cleanupRichSubtree(source.weekId);
      await cleanupRichSubtree(target.weekId);
    }
  });

  it("no-ops on an empty source and preserves the target subtree (MT-2)", async () => {
    const targetParam = nextParam();
    const sourceParam = nextParam();
    const target = await buildRichSubtree(ctx.activePlanId, startDateOf(targetParam), ctx.catalog);
    const emptySource = await cleanupRaw.week.create({
      data: { planId: ctx.activePlanId, startDate: startDateOf(sourceParam) },
    });
    const targetBefore = sessionIds(await readDaysForWeek(target.weekId));

    try {
      const result = await lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, {
        sourceStartDate: sourceParam,
      });

      expect(result).toEqual({ cloned: false, reason: "empty-source" });
      expect(sessionIds(await readDaysForWeek(target.weekId))).toEqual(targetBefore);
    } finally {
      await cleanupRichSubtree(target.weekId);
      await cleanupRaw.week.delete({ where: { id: emptySource.id } }).catch(() => {});
    }
  });

  it("no-ops when the source week has only empty day shells (MT-2)", async () => {
    const targetParam = nextParam();
    const sourceParam = nextParam();
    const target = await buildRichSubtree(ctx.activePlanId, startDateOf(targetParam), ctx.catalog);
    const emptySource = await cleanupRaw.week.create({
      data: { planId: ctx.activePlanId, startDate: startDateOf(sourceParam) },
    });

    await cleanupRaw.day.create({ data: { weekId: emptySource.id, dayOfWeek: "MONDAY" } });

    try {
      const result = await lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, {
        sourceStartDate: sourceParam,
      });

      expect(result).toEqual({ cloned: false, reason: "empty-source" });
    } finally {
      await cleanupRichSubtree(target.weekId);
      await cleanupRaw.day.deleteMany({ where: { weekId: emptySource.id } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: emptySource.id } }).catch(() => {});
    }
  });

  it("rejects a source week that does not exist with BadRequestError, not a no-op (MT-3)", async () => {
    const targetParam = nextParam();
    const missingSourceParam = nextParam();
    const target = await buildRichSubtree(ctx.activePlanId, startDateOf(targetParam), ctx.catalog);
    const before = sessionIds(await readDaysForWeek(target.weekId));

    try {
      await expect(
        lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, {
          sourceStartDate: missingSourceParam,
        }),
      ).rejects.toThrow(BadRequestError);

      expect(sessionIds(await readDaysForWeek(target.weekId))).toEqual(before);
    } finally {
      await cleanupRichSubtree(target.weekId);
    }
  });

  it("rebuilds a week cloned onto itself with fresh ids and no row loss (MT-5)", async () => {
    const sameParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sameParam), ctx.catalog);
    const before = await readDaysForWeek(source.weekId);

    try {
      const result = await lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, sameParam, {
        sourceStartDate: sameParam,
      });

      expect(result.cloned).toBe(true);

      const after = await readDaysForWeek(source.weekId);
      const beforeSessionIds = new Set(sessionIds(before));

      expect(rowCount(after)).toBe(rowCount(before));
      expect(sessionIds(after).every((id) => !beforeSessionIds.has(id))).toBe(true);

      assertDaysDeepEqual(before, after);
    } finally {
      await cleanupRichSubtree(source.weekId);
    }
  });

  it("rejects a non-owner coach (MT-6)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sourceParam), ctx.catalog);

    try {
      await expect(
        lmsWeekApi.cloneFrom(ctx.otherCoach.user.id, ctx.activePlanId, targetParam, {
          sourceStartDate: sourceParam,
        }),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(source.weekId);
    }
  });

  it("rejects an archived target plan (MT-6)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(
      ctx.archivedPlanId,
      startDateOf(sourceParam),
      ctx.catalog,
    );

    try {
      await expect(
        lmsWeekApi.cloneFrom(ctx.owner.user.id, ctx.archivedPlanId, targetParam, {
          sourceStartDate: sourceParam,
        }),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(source.weekId);
    }
  });
});
