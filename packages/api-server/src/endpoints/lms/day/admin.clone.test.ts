import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { assertSessionsDeepEqual, readSessionsForDay } from "../_shared/clone-assert";
import { buildRichSubtree, cleanupRichSubtree } from "../_shared/clone-fixture";
import {
  type CloneSuiteContext,
  setupCloneSuite,
  teardownCloneSuite,
} from "../_shared/clone-suite-setup";

import { lmsDayMetadataApi } from "./admin";

const SOURCE_DOW = "MONDAY";
const TARGET_DOW = "FRIDAY";

const dateParam = (offsetWeeks: number): string => {
  const date = new Date(Date.UTC(2027, 0, 4));

  date.setUTCDate(date.getUTCDate() + offsetWeeks * 7);

  return date.toISOString().slice(0, 10);
};

const startDateOf = (param: string): Date => new Date(`${param}T00:00:00.000Z`);

const dayOf = (weekId: string, dayOfWeek: "MONDAY" | "FRIDAY"): Promise<{ id: string } | null> =>
  cleanupRaw.day.findFirst({ where: { weekId, dayOfWeek }, select: { id: true } });

describe("lmsDayMetadataApi.cloneFrom", () => {
  let ctx: CloneSuiteContext;
  let weekCounter = 0;

  const nextParam = (): string => {
    weekCounter += 1;

    return dateParam(weekCounter * 3);
  };

  beforeAll(async () => {
    ctx = await setupCloneSuite();
  });

  afterAll(async () => {
    await teardownCloneSuite(ctx);
  });

  it("deep round-trips a source day into the target slot, overwriting label + notes (MT-1)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sourceParam), ctx.catalog);
    const sourceDay = await dayOf(source.weekId, SOURCE_DOW);

    try {
      const result = await lmsDayMetadataApi.cloneFrom(
        ctx.owner.user.id,
        ctx.activePlanId,
        targetParam,
        TARGET_DOW,
        { sourceStartDate: sourceParam, sourceDayOfWeek: SOURCE_DOW },
      );

      expect(result.cloned).toBe(true);

      if (result.cloned) {
        expect(result.day.dayOfWeek).toBe(TARGET_DOW);
        expect(result.day.label?.id).toBe(ctx.catalog.dayLabelId);
        expect(result.day.notes).toEqual([`day note ${SOURCE_DOW}`]);
      }

      const targetDay = await dayOf(
        (
          await cleanupRaw.week.findUniqueOrThrow({
            where: {
              planId_startDate: { planId: ctx.activePlanId, startDate: startDateOf(targetParam) },
            },
          })
        ).id,
        TARGET_DOW,
      );

      expect(sourceDay).not.toBeNull();
      expect(targetDay).not.toBeNull();

      if (sourceDay && targetDay) {
        const sourceSessions = await readSessionsForDay(sourceDay.id);
        const cloneSessions = await readSessionsForDay(targetDay.id);

        assertSessionsDeepEqual(sourceSessions, cloneSessions);
      }
    } finally {
      await cleanupRichSubtree(source.weekId);
      const target = await cleanupRaw.week.findUnique({
        where: {
          planId_startDate: { planId: ctx.activePlanId, startDate: startDateOf(targetParam) },
        },
      });

      if (target) {
        await cleanupRichSubtree(target.id);
      }
    }
  });

  it("replaces the target day's existing sessions via cascade (MT-4)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sourceParam), ctx.catalog);
    const targetWeek = await cleanupRaw.week.create({
      data: { planId: ctx.activePlanId, startDate: startDateOf(targetParam) },
    });
    const targetDay = await cleanupRaw.day.create({
      data: { weekId: targetWeek.id, dayOfWeek: TARGET_DOW },
    });
    const staleSession = await cleanupRaw.session.create({
      data: { dayId: targetDay.id, order: 10 },
    });
    const sourceDay = await dayOf(source.weekId, SOURCE_DOW);

    try {
      const result = await lmsDayMetadataApi.cloneFrom(
        ctx.owner.user.id,
        ctx.activePlanId,
        targetParam,
        TARGET_DOW,
        { sourceStartDate: sourceParam, sourceDayOfWeek: SOURCE_DOW },
      );

      expect(result.cloned).toBe(true);

      const staleAfter = await cleanupRaw.session.findUnique({ where: { id: staleSession.id } });

      expect(staleAfter).toBeNull();

      if (sourceDay) {
        const sourceSessions = await readSessionsForDay(sourceDay.id);
        const cloneSessions = await readSessionsForDay(targetDay.id);

        assertSessionsDeepEqual(sourceSessions, cloneSessions);
      }
    } finally {
      await cleanupRichSubtree(source.weekId);
      await cleanupRichSubtree(targetWeek.id);
    }
  });

  it("no-ops on an empty source day without overwriting target label or notes (MT-2)", async () => {
    const sourceParam = nextParam();
    const targetParam = nextParam();
    const sourceWeek = await cleanupRaw.week.create({
      data: { planId: ctx.activePlanId, startDate: startDateOf(sourceParam) },
    });

    await cleanupRaw.day.create({ data: { weekId: sourceWeek.id, dayOfWeek: SOURCE_DOW } });

    const targetWeek = await cleanupRaw.week.create({
      data: { planId: ctx.activePlanId, startDate: startDateOf(targetParam) },
    });
    const targetDay = await cleanupRaw.day.create({
      data: {
        weekId: targetWeek.id,
        dayOfWeek: TARGET_DOW,
        labelId: ctx.catalog.dayLabelId,
        notes: ["target day own note"],
      },
    });

    try {
      const result = await lmsDayMetadataApi.cloneFrom(
        ctx.owner.user.id,
        ctx.activePlanId,
        targetParam,
        TARGET_DOW,
        { sourceStartDate: sourceParam, sourceDayOfWeek: SOURCE_DOW },
      );

      expect(result).toEqual({ cloned: false, reason: "empty-source" });

      const targetAfter = await cleanupRaw.day.findUniqueOrThrow({ where: { id: targetDay.id } });

      expect(targetAfter.labelId).toBe(ctx.catalog.dayLabelId);
      expect(targetAfter.notes).toEqual(["target day own note"]);
    } finally {
      await cleanupRaw.day.deleteMany({ where: { weekId: sourceWeek.id } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: sourceWeek.id } }).catch(() => {});
      await cleanupRaw.day.deleteMany({ where: { weekId: targetWeek.id } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: targetWeek.id } }).catch(() => {});
    }
  });

  it("rejects a source day that does not exist with BadRequestError (MT-3)", async () => {
    const targetParam = nextParam();
    const missingSourceParam = nextParam();
    const targetWeek = await cleanupRaw.week.create({
      data: { planId: ctx.activePlanId, startDate: startDateOf(targetParam) },
    });
    const targetDay = await cleanupRaw.day.create({
      data: { weekId: targetWeek.id, dayOfWeek: TARGET_DOW, labelId: ctx.catalog.dayLabelId },
    });

    try {
      await expect(
        lmsDayMetadataApi.cloneFrom(ctx.owner.user.id, ctx.activePlanId, targetParam, TARGET_DOW, {
          sourceStartDate: missingSourceParam,
          sourceDayOfWeek: SOURCE_DOW,
        }),
      ).rejects.toThrow(BadRequestError);

      const targetAfter = await cleanupRaw.day.findUniqueOrThrow({ where: { id: targetDay.id } });

      expect(targetAfter.labelId).toBe(ctx.catalog.dayLabelId);
    } finally {
      await cleanupRaw.day.deleteMany({ where: { weekId: targetWeek.id } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: targetWeek.id } }).catch(() => {});
    }
  });

  it("rebuilds a day cloned onto itself with fresh ids and no row loss (MT-5)", async () => {
    const sameParam = nextParam();
    const source = await buildRichSubtree(ctx.activePlanId, startDateOf(sameParam), ctx.catalog);
    const sourceDay = await dayOf(source.weekId, SOURCE_DOW);

    try {
      expect(sourceDay).not.toBeNull();

      if (sourceDay) {
        const before = await readSessionsForDay(sourceDay.id);

        const result = await lmsDayMetadataApi.cloneFrom(
          ctx.owner.user.id,
          ctx.activePlanId,
          sameParam,
          SOURCE_DOW,
          { sourceStartDate: sameParam, sourceDayOfWeek: SOURCE_DOW },
        );

        expect(result.cloned).toBe(true);

        const after = await readSessionsForDay(sourceDay.id);
        const beforeIds = new Set(before.map((s) => s.id));

        expect(after).toHaveLength(before.length);
        expect(after.every((s) => !beforeIds.has(s.id))).toBe(true);

        assertSessionsDeepEqual(before, after);
      }
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
        lmsDayMetadataApi.cloneFrom(
          ctx.otherCoach.user.id,
          ctx.activePlanId,
          targetParam,
          TARGET_DOW,
          { sourceStartDate: sourceParam, sourceDayOfWeek: SOURCE_DOW },
        ),
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
        lmsDayMetadataApi.cloneFrom(
          ctx.owner.user.id,
          ctx.archivedPlanId,
          targetParam,
          TARGET_DOW,
          { sourceStartDate: sourceParam, sourceDayOfWeek: SOURCE_DOW },
        ),
      ).rejects.toThrow(ForbiddenError);
    } finally {
      await cleanupRichSubtree(source.weekId);
    }
  });
});
