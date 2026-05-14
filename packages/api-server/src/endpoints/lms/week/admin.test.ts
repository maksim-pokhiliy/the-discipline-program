import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError } from "@repo/errors";

import { cleanupRaw, createTestCoach } from "../../../test/helpers";

import { lmsWeekApi } from "./admin";

const MONDAY_PARAM = "2026-05-18";
const WEDNESDAY_PARAM = "2026-05-20";

describe("lmsWeekApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    const activePlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Active Plan", status: "ACTIVE" },
    });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Archived Plan", status: "ARCHIVED" },
    });

    archivedPlanId = archivedPlan.id;
  });

  afterAll(async () => {
    await cleanupRaw.week
      .deleteMany({ where: { planId: { in: [activePlanId, archivedPlanId] } } })
      .catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("getByPlanAndDate", () => {
    it("rejects when caller does not own the plan and is not admin/head-coach", async () => {
      await expect(
        lmsWeekApi.getByPlanAndDate(otherCoach.user.id, activePlanId, MONDAY_PARAM),
      ).rejects.toThrow(ForbiddenError);
    });

    it("returns null without throwing for an unmaterialized slot", async () => {
      await expect(
        lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM),
      ).resolves.toBeNull();
    });
  });

  describe("upsertNotes", () => {
    it("rejects when caller does not own the plan and is not admin/head-coach", async () => {
      await expect(
        lmsWeekApi.upsertNotes(otherCoach.user.id, activePlanId, MONDAY_PARAM, { notes: "x" }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects with ForbiddenError on an archived plan", async () => {
      await expect(
        lmsWeekApi.upsertNotes(coach.user.id, archivedPlanId, MONDAY_PARAM, { notes: "x" }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("creates the row on the first call and updates it on the second", async () => {
      const first = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, MONDAY_PARAM, {
        notes: "first note",
      });

      try {
        expect(first.notes).toBe("first note");

        const second = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, MONDAY_PARAM, {
          notes: "second note",
        });

        expect(second.id).toBe(first.id);
        expect(second.notes).toBe("second note");
      } finally {
        await cleanupRaw.week.delete({ where: { id: first.id } }).catch(() => {});
      }
    });

    it("snaps a non-Monday param to that week's Monday", async () => {
      const created = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, WEDNESDAY_PARAM, {
        notes: "wednesday note",
      });

      try {
        const byMonday = await lmsWeekApi.getByPlanAndDate(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
        );

        expect(byMonday?.id).toBe(created.id);

        const reupserted = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, MONDAY_PARAM, {
          notes: "monday note",
        });

        expect(reupserted.id).toBe(created.id);
      } finally {
        await cleanupRaw.week.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });
});
