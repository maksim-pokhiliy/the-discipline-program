import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { BadRequestError, ForbiddenError } from "@repo/errors";

import { cleanupRaw, createTestCoach } from "../../../test/helpers";

import { lmsWeekApi } from "./admin";

const MONDAY_PARAM = "2026-05-18";
const WEDNESDAY_PARAM = "2026-05-20";
const EXPECTED_UTC_MONDAY = new Date(Date.UTC(2026, 4, 18));
const IMPOSSIBLE_DATE_PARAMS = ["2026-13-40", "2026-02-30", "2026-04-31"];

const expectEmptySlot = (
  slot: { dayOfWeek: string; label: unknown; notes: unknown; sessions: unknown[] },
  dow: string,
) => {
  expect(slot.dayOfWeek).toBe(dow);
  expect(slot.label).toBeNull();
  expect(slot.notes).toBeNull();
  expect(slot.sessions).toEqual([]);
};

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

    it("returns { week: null, days: 7 empty slots } for an unmaterialized week", async () => {
      const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

      expect(result.week).toBeNull();
      expect(result.days).toHaveLength(7);

      result.days.forEach((slot, index) => {
        expectEmptySlot(slot, dayOfWeekValues[index] ?? "");
      });
    });

    it("rejects with BadRequestError for a regex-passing but impossible startDate", async () => {
      for (const param of IMPOSSIBLE_DATE_PARAMS) {
        await expect(
          lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, param),
        ).rejects.toThrow(BadRequestError);
      }
    });

    it("returns a materialized week with notes only and 7 empty days", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY, notes: "test" },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        expect(result.week?.notes).toBe("test");
        expect(result.days).toHaveLength(7);
        result.days.forEach((slot, index) => {
          expectEmptySlot(slot, dayOfWeekValues[index] ?? "");
        });
      } finally {
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("places a single materialized Wednesday Day at index 2 with empty fields", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "WEDNESDAY" },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        expect(result.days[2]?.dayOfWeek).toBe("WEDNESDAY");
        expect(result.days[2]?.label).toBeNull();
        expect(result.days[2]?.notes).toBeNull();
        expect(result.days[2]?.sessions).toEqual([]);

        [0, 1, 3, 4, 5, 6].forEach((i) => {
          expectEmptySlot(result.days[i] ?? ({} as never), dayOfWeekValues[i] ?? "");
        });
      } finally {
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("returns Tuesday with embedded label and 2 sessions (one with embedded label)", async () => {
      const labelSuffix = crypto.randomUUID().slice(0, 8);
      const dayLabel = await cleanupRaw.label.create({
        data: {
          name: `Day Label ${labelSuffix}`,
          nameLower: `day label ${labelSuffix}`,
          applicableLevels: ["DAY"],
        },
      });
      const sessionLabel = await cleanupRaw.label.create({
        data: {
          name: `Session Label ${labelSuffix}`,
          nameLower: `session label ${labelSuffix}`,
          applicableLevels: ["SESSION"],
        },
      });
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: {
          weekId: week.id,
          dayOfWeek: "TUESDAY",
          labelId: dayLabel.id,
          notes: "tuesday focus",
        },
      });
      const sessionA = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const sessionB = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 20, labelId: sessionLabel.id },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        expect(result.days[1]?.dayOfWeek).toBe("TUESDAY");
        expect(result.days[1]?.label?.id).toBe(dayLabel.id);
        expect(result.days[1]?.notes).toBe("tuesday focus");
        expect(result.days[1]?.sessions).toHaveLength(2);
        expect(result.days[1]?.sessions[0]?.order).toBe(10);
        expect(result.days[1]?.sessions[0]?.label).toBeNull();
        expect(result.days[1]?.sessions[1]?.order).toBe(20);
        expect(result.days[1]?.sessions[1]?.label?.id).toBe(sessionLabel.id);

        expectEmptySlot(result.days[0] ?? ({} as never), "MONDAY");
        expectEmptySlot(result.days[2] ?? ({} as never), "WEDNESDAY");
      } finally {
        await cleanupRaw.session.delete({ where: { id: sessionA.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: sessionB.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
        await cleanupRaw.label.delete({ where: { id: dayLabel.id } }).catch(() => {});
        await cleanupRaw.label.delete({ where: { id: sessionLabel.id } }).catch(() => {});
      }
    });

    it("returns sessions sorted ascending by order regardless of insertion order", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "THURSDAY" },
      });
      const later = await cleanupRaw.session.create({ data: { dayId: day.id, order: 20 } });
      const earlier = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        expect(result.days[3]?.sessions.map((s) => s.order)).toEqual([10, 20]);
      } finally {
        await cleanupRaw.session.delete({ where: { id: later.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: earlier.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });
  });

  describe("upsertNotes", () => {
    it("rejects a non-owner and materializes no Week row as a side effect", async () => {
      await expect(
        lmsWeekApi.upsertNotes(otherCoach.user.id, activePlanId, MONDAY_PARAM, { notes: "x" }),
      ).rejects.toThrow(ForbiddenError);

      const after = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

      expect(after.week).toBeNull();
      expect(after.days).toHaveLength(7);
    });

    it("rejects on an archived plan and materializes no Week row as a side effect", async () => {
      await expect(
        lmsWeekApi.upsertNotes(coach.user.id, archivedPlanId, MONDAY_PARAM, { notes: "x" }),
      ).rejects.toThrow(ForbiddenError);

      const after = await lmsWeekApi.getByPlanAndDate(coach.user.id, archivedPlanId, MONDAY_PARAM);

      expect(after.week).toBeNull();
      expect(after.days).toHaveLength(7);
    });

    it("rejects with BadRequestError for a regex-passing but impossible startDate", async () => {
      for (const param of IMPOSSIBLE_DATE_PARAMS) {
        await expect(
          lmsWeekApi.upsertNotes(coach.user.id, activePlanId, param, { notes: "x" }),
        ).rejects.toThrow(BadRequestError);
      }
    });

    it("materializes a row with notes null when upserting null onto an unmaterialized slot", async () => {
      const created = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, MONDAY_PARAM, {
        notes: null,
      });

      try {
        expect(created.notes).toBeNull();

        const stored = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        expect(stored.week?.id).toBe(created.id);
        expect(stored.week?.notes).toBeNull();
        expect(stored.days).toHaveLength(7);
      } finally {
        await cleanupRaw.week.delete({ where: { id: created.id } }).catch(() => {});
      }
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

        expect(byMonday.week?.id).toBe(created.id);

        const reupserted = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, MONDAY_PARAM, {
          notes: "monday note",
        });

        expect(reupserted.id).toBe(created.id);
      } finally {
        await cleanupRaw.week.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("persists startDate as the intended Monday regardless of server timezone", async () => {
      const created = await lmsWeekApi.upsertNotes(coach.user.id, activePlanId, WEDNESDAY_PARAM, {
        notes: "tz round-trip note",
      });

      try {
        expect(created.startDate.getUTCFullYear()).toBe(2026);
        expect(created.startDate.getUTCMonth()).toBe(4);
        expect(created.startDate.getUTCDate()).toBe(18);

        const roundTripped = await lmsWeekApi.getByPlanAndDate(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
        );

        expect(roundTripped.week?.startDate.getUTCFullYear()).toBe(2026);
        expect(roundTripped.week?.startDate.getUTCMonth()).toBe(4);
        expect(roundTripped.week?.startDate.getUTCDate()).toBe(18);
      } finally {
        await cleanupRaw.week.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });
});
