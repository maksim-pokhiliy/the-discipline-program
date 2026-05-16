import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSessionApi } from "./admin";

const MONDAY_PARAM = "2026-05-18";
const WEDNESDAY_PARAM = "2026-05-20";
const NEXT_MONDAY_PARAM = "2026-05-25";
const EXPECTED_UTC_MONDAY = new Date(Date.UTC(2026, 4, 18));
const EXPECTED_UTC_NEXT_MONDAY = new Date(Date.UTC(2026, 4, 25));

describe("lmsSessionApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;
  let sessionLabelId: string;
  let dayOnlyLabelId: string;
  let blockOnlyLabelId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    const activePlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Archived Plan", status: "ARCHIVED" },
    });

    archivedPlanId = archivedPlan.id;

    const labelSuffix = crypto.randomUUID().slice(0, 8);
    const sessionLabel = await cleanupRaw.label.create({
      data: {
        name: `Session Label ${labelSuffix}`,
        nameLower: `session label ${labelSuffix}`,
        applicableLevels: ["SESSION"],
        notes: null,
      },
    });

    sessionLabelId = sessionLabel.id;

    const dayLabel = await cleanupRaw.label.create({
      data: {
        name: `Day Only Label ${labelSuffix}`,
        nameLower: `day only label ${labelSuffix}`,
        applicableLevels: ["DAY"],
        notes: null,
      },
    });

    dayOnlyLabelId = dayLabel.id;

    const blockLabel = await cleanupRaw.label.create({
      data: {
        name: `Block Only Label ${labelSuffix}`,
        nameLower: `block only label ${labelSuffix}`,
        applicableLevels: ["BLOCK"],
        notes: null,
      },
    });

    blockOnlyLabelId = blockLabel.id;
  });

  afterAll(async () => {
    await cleanupRaw.session
      .deleteMany({ where: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } })
      .catch(() => {});
    await cleanupRaw.day
      .deleteMany({ where: { week: { planId: { in: [activePlanId, archivedPlanId] } } } })
      .catch(() => {});
    await cleanupRaw.week
      .deleteMany({ where: { planId: { in: [activePlanId, archivedPlanId] } } })
      .catch(() => {});
    await cleanupRaw.label.delete({ where: { id: sessionLabelId } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: dayOnlyLabelId } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: blockOnlyLabelId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("rejects when caller does not own the plan", async () => {
      await expect(
        lmsSessionApi.create(otherCoach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: null,
          notes: null,
        }),
      ).rejects.toThrow(ForbiddenError);

      const sessionCount = await cleanupRaw.session.count({
        where: { day: { week: { planId: activePlanId } } },
      });
      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

      expect(sessionCount).toBe(0);
      expect(weekCount).toBe(0);
    });

    it("rejects on an archived plan", async () => {
      await expect(
        lmsSessionApi.create(coach.user.id, archivedPlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: null,
          notes: null,
        }),
      ).rejects.toThrow(ForbiddenError);

      const sessionCount = await cleanupRaw.session.count({
        where: { day: { week: { planId: archivedPlanId } } },
      });
      const weekCount = await cleanupRaw.week.count({ where: { planId: archivedPlanId } });

      expect(sessionCount).toBe(0);
      expect(weekCount).toBe(0);
    });

    it("materializes Week + Day + Session in an empty week", async () => {
      const session = await lmsSessionApi.create(
        coach.user.id,
        activePlanId,
        MONDAY_PARAM,
        "TUESDAY",
        { labelId: null, notes: null },
      );

      try {
        expect(session.order).toBe(10);
        expect(session.labelId).toBeNull();
        expect(session.notes).toBeNull();

        const week = await cleanupRaw.week.findUnique({
          where: { planId_startDate: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY } },
        });

        if (!week) {
          throw new Error("expected Week to be materialized");
        }

        const day = await cleanupRaw.day.findUnique({
          where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: "TUESDAY" } },
        });

        expect(day).not.toBeNull();
        expect(day?.id).toBe(session.dayId);
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.deleteMany({ where: { id: session.dayId } }).catch(() => {});
        await cleanupRaw.week
          .deleteMany({ where: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY } })
          .catch(() => {});
      }
    });

    it("reuses an existing Week when materializing a Day in a new weekday", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const tuesdayDay = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const tuesdaySession = await cleanupRaw.session.create({
        data: { dayId: tuesdayDay.id, order: 10 },
      });

      try {
        const thursdaySession = await lmsSessionApi.create(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "THURSDAY",
          { labelId: null, notes: null },
        );

        const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

        expect(weekCount).toBe(1);

        const tuesdayAfter = await cleanupRaw.day.findUnique({ where: { id: tuesdayDay.id } });

        expect(tuesdayAfter).not.toBeNull();
        expect(tuesdayAfter?.dayOfWeek).toBe("TUESDAY");

        const thursdayDay = await cleanupRaw.day.findUnique({
          where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: "THURSDAY" } },
        });

        if (!thursdayDay) {
          throw new Error("expected Thursday Day to be materialized");
        }

        expect(thursdaySession.dayId).toBe(thursdayDay.id);
        expect(thursdaySession.order).toBe(10);

        await cleanupRaw.session.delete({ where: { id: thursdaySession.id } });
        await cleanupRaw.day.delete({ where: { id: thursdayDay.id } });
      } finally {
        await cleanupRaw.session.delete({ where: { id: tuesdaySession.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: tuesdayDay.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("assigns the next sparse order on a populated Day", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const first = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const second = await cleanupRaw.session.create({ data: { dayId: day.id, order: 20 } });

      try {
        const third = await lmsSessionApi.create(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "TUESDAY",
          { labelId: null, notes: null },
        );

        try {
          expect(third.order).toBe(30);
          expect(third.dayId).toBe(day.id);
        } finally {
          await cleanupRaw.session.delete({ where: { id: third.id } }).catch(() => {});
        }
      } finally {
        await cleanupRaw.session.delete({ where: { id: first.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: second.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects a label whose applicableLevels does not include SESSION (OQ-C)", async () => {
      await expect(
        lmsSessionApi.create(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: dayOnlyLabelId,
          notes: null,
        }),
      ).rejects.toThrow(BadRequestError);

      const sessionCount = await cleanupRaw.session.count({
        where: { day: { week: { planId: activePlanId } } },
      });
      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

      expect(sessionCount).toBe(0);
      expect(weekCount).toBe(0);
    });

    it("rejects a non-existent labelId without creating any side-effect (OQ-C)", async () => {
      await expect(
        lmsSessionApi.create(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: "clz0000000000000000000000",
          notes: null,
        }),
      ).rejects.toThrow(NotFoundError);

      const sessionCount = await cleanupRaw.session.count({
        where: { day: { week: { planId: activePlanId } } },
      });
      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

      expect(sessionCount).toBe(0);
      expect(weekCount).toBe(0);
    });
  });

  describe("update", () => {
    it("updates labelId and notes and rejects non-owner", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10 },
      });

      try {
        const updated = await lmsSessionApi.update(coach.user.id, session.id, {
          labelId: sessionLabelId,
          notes: "test notes",
        });

        expect(updated.labelId).toBe(sessionLabelId);
        expect(updated.notes).toBe("test notes");

        await expect(
          lmsSessionApi.update(otherCoach.user.id, session.id, {
            labelId: null,
            notes: "tamper",
          }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.session.findUnique({ where: { id: session.id } });

        expect(stored?.labelId).toBe(sessionLabelId);
        expect(stored?.notes).toBe("test notes");
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects a label whose applicableLevels does not include SESSION (OQ-C)", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10, labelId: sessionLabelId },
      });

      try {
        await expect(
          lmsSessionApi.update(coach.user.id, session.id, { labelId: blockOnlyLabelId }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.session.findUnique({ where: { id: session.id } });

        expect(stored?.labelId).toBe(sessionLabelId);
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("allows clearing the label with labelId: null (no applicableLevels check)", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10, labelId: sessionLabelId },
      });

      try {
        const updated = await lmsSessionApi.update(coach.user.id, session.id, { labelId: null });

        expect(updated.labelId).toBeNull();
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });
  });

  describe("delete", () => {
    it("removes the Session and cascades to Block", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10 },
      });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });

      try {
        await lmsSessionApi.delete(coach.user.id, session.id);

        const sessionAfter = await cleanupRaw.session.findUnique({ where: { id: session.id } });

        expect(sessionAfter).toBeNull();

        const blockAfter = await cleanupRaw.block.findMany({ where: { sessionId: session.id } });

        expect(blockAfter).toEqual([]);

        const blockById = await cleanupRaw.block.findUnique({ where: { id: block.id } });

        expect(blockById).toBeNull();
      } finally {
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects when caller does not own the session", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10 },
      });

      try {
        await expect(lmsSessionApi.delete(otherCoach.user.id, session.id)).rejects.toThrow(
          ForbiddenError,
        );

        const stored = await cleanupRaw.session.findUnique({ where: { id: session.id } });

        expect(stored).not.toBeNull();
        expect(stored?.id).toBe(session.id);
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });
  });

  describe("reorder", () => {
    it("renumbers sessions on the happy path", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const a = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const b = await cleanupRaw.session.create({ data: { dayId: day.id, order: 20 } });
      const c = await cleanupRaw.session.create({ data: { dayId: day.id, order: 30 } });

      try {
        const returned = await lmsSessionApi.reorder(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "TUESDAY",
          { orderedIds: [c.id, a.id, b.id] },
        );

        expect(returned.map((s) => ({ id: s.id, order: s.order }))).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);

        const stored = await cleanupRaw.session.findMany({
          where: { dayId: day.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);
      } finally {
        await cleanupRaw.session.delete({ where: { id: a.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: b.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: c.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects ids that belong to a different Day", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const tuesdayDay = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const wednesdayDay = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "WEDNESDAY" },
      });
      const tuesdaySession = await cleanupRaw.session.create({
        data: { dayId: tuesdayDay.id, order: 10 },
      });
      const wednesdaySession = await cleanupRaw.session.create({
        data: { dayId: wednesdayDay.id, order: 10 },
      });

      try {
        await expect(
          lmsSessionApi.reorder(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
            orderedIds: [tuesdaySession.id, wednesdaySession.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const tuesdayAfter = await cleanupRaw.session.findUnique({
          where: { id: tuesdaySession.id },
        });
        const wednesdayAfter = await cleanupRaw.session.findUnique({
          where: { id: wednesdaySession.id },
        });

        expect(tuesdayAfter?.order).toBe(10);
        expect(wednesdayAfter?.order).toBe(10);
      } finally {
        await cleanupRaw.session.delete({ where: { id: tuesdaySession.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: wednesdaySession.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: tuesdayDay.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: wednesdayDay.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects when orderedIds is a subset of the target Day's sessions", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const a = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const b = await cleanupRaw.session.create({ data: { dayId: day.id, order: 20 } });
      const c = await cleanupRaw.session.create({ data: { dayId: day.id, order: 30 } });

      try {
        await expect(
          lmsSessionApi.reorder(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
            orderedIds: [a.id, b.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.session.findMany({
          where: { dayId: day.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: a.id, order: 10 },
          { id: b.id, order: 20 },
          { id: c.id, order: 30 },
        ]);
      } finally {
        await cleanupRaw.session.delete({ where: { id: a.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: b.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: c.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects when orderedIds references a non-existent session", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const a = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });

      try {
        await expect(
          lmsSessionApi.reorder(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
            orderedIds: [a.id, "clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.session.findUnique({ where: { id: a.id } });

        expect(stored?.order).toBe(10);
      } finally {
        await cleanupRaw.session.delete({ where: { id: a.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("rejects on an unmaterialized Day slot without any side-effect", async () => {
      await expect(
        lmsSessionApi.reorder(coach.user.id, activePlanId, NEXT_MONDAY_PARAM, "MONDAY", {
          orderedIds: ["clz0000000000000000000000"],
        }),
      ).rejects.toThrow(BadRequestError);

      const weekCount = await cleanupRaw.week.count({
        where: { planId: activePlanId, startDate: EXPECTED_UTC_NEXT_MONDAY },
      });

      expect(weekCount).toBe(0);

      const dayCount = await cleanupRaw.day.count({
        where: { week: { planId: activePlanId, startDate: EXPECTED_UTC_NEXT_MONDAY } },
      });

      expect(dayCount).toBe(0);
    });
  });

  describe("TZ invariance", () => {
    it("persists Week.startDate as UTC-midnight Monday for a Wednesday create regardless of server timezone", async () => {
      const session = await lmsSessionApi.create(
        coach.user.id,
        activePlanId,
        WEDNESDAY_PARAM,
        "WEDNESDAY",
        { labelId: null, notes: null },
      );

      try {
        const day = await cleanupRaw.day.findUnique({ where: { id: session.dayId } });

        if (!day) {
          throw new Error("expected Day to be materialized");
        }

        const week = await cleanupRaw.week.findUnique({ where: { id: day.weekId } });

        if (!week) {
          throw new Error("expected Week to be materialized");
        }

        expect(week.startDate.getUTCFullYear()).toBe(2026);
        expect(week.startDate.getUTCMonth()).toBe(4);
        expect(week.startDate.getUTCDate()).toBe(18);
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.deleteMany({ where: { id: session.dayId } }).catch(() => {});
        await cleanupRaw.week
          .deleteMany({ where: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY } })
          .catch(() => {});
      }
    });
  });
});
