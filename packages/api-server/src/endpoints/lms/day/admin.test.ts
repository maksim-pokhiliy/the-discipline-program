import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach } from "../../../test/helpers";

import { lmsDayMetadataApi } from "./admin";

const MONDAY_PARAM = "2026-05-18";
const WEDNESDAY_PARAM = "2026-05-20";
const EXPECTED_UTC_MONDAY = new Date(Date.UTC(2026, 4, 18));

const N_ROUNDS_PARAMS = {
  archetype: "n-rounds" as const,
  params: { countForm: "exact" as const, count: 5 },
};

const REST_SLOT_PAYLOAD = { rowKind: "REST_SLOT" as const };

describe("lmsDayMetadataApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;
  let dayLabelId: string;
  let sessionOnlyLabelId: string;
  let sessionLabelId: string;
  let atomicArchetypeId: string;

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

    const suffix = crypto.randomUUID().slice(0, 8);

    const dayLabel = await cleanupRaw.label.create({
      data: {
        name: `Day Label ${suffix}`,
        nameLower: `day label ${suffix}`,
        applicableLevels: ["DAY"],
      },
    });

    dayLabelId = dayLabel.id;

    const sessionOnlyLabel = await cleanupRaw.label.create({
      data: {
        name: `Session Only Label ${suffix}`,
        nameLower: `session only label ${suffix}`,
        applicableLevels: ["SESSION", "BLOCK"],
      },
    });

    sessionOnlyLabelId = sessionOnlyLabel.id;

    const sessionLabel = await cleanupRaw.label.create({
      data: {
        name: `Session Label ${suffix}`,
        nameLower: `session label ${suffix}`,
        applicableLevels: ["SESSION"],
      },
    });

    sessionLabelId = sessionLabel.id;

    const atomic = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "n-rounds" },
      select: { id: true },
    });

    atomicArchetypeId = atomic.id;
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
    await cleanupRaw.label.delete({ where: { id: dayLabelId } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: sessionOnlyLabelId } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: sessionLabelId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("setLabel", () => {
    it("rejects when caller does not own the plan, with no side-effect", async () => {
      await expect(
        lmsDayMetadataApi.setLabel(otherCoach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: dayLabelId,
        }),
      ).rejects.toThrow(ForbiddenError);

      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });
      const dayCount = await cleanupRaw.day.count({
        where: { week: { planId: activePlanId } },
      });

      expect(weekCount).toBe(0);
      expect(dayCount).toBe(0);
    });

    it("rejects on an archived plan, with no side-effect", async () => {
      await expect(
        lmsDayMetadataApi.setLabel(coach.user.id, archivedPlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: dayLabelId,
        }),
      ).rejects.toThrow(ForbiddenError);

      const weekCount = await cleanupRaw.week.count({ where: { planId: archivedPlanId } });
      const dayCount = await cleanupRaw.day.count({
        where: { week: { planId: archivedPlanId } },
      });

      expect(weekCount).toBe(0);
      expect(dayCount).toBe(0);
    });

    it("rejects a non-existent labelId, no Day materialization", async () => {
      await expect(
        lmsDayMetadataApi.setLabel(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: "clz0000000000000000000000",
        }),
      ).rejects.toThrow(NotFoundError);

      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });
      const dayCount = await cleanupRaw.day.count({
        where: { week: { planId: activePlanId } },
      });

      expect(weekCount).toBe(0);
      expect(dayCount).toBe(0);
    });

    it("rejects a label whose applicableLevels does not include DAY, no materialization", async () => {
      await expect(
        lmsDayMetadataApi.setLabel(coach.user.id, activePlanId, MONDAY_PARAM, "TUESDAY", {
          labelId: sessionOnlyLabelId,
        }),
      ).rejects.toThrow(BadRequestError);

      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });
      const dayCount = await cleanupRaw.day.count({
        where: { week: { planId: activePlanId } },
      });

      expect(weekCount).toBe(0);
      expect(dayCount).toBe(0);
    });

    it("materializes Week + Day on first call with a valid DAY label", async () => {
      try {
        const slot = await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "TUESDAY",
          { labelId: dayLabelId },
        );

        expect(slot.dayOfWeek).toBe("TUESDAY");
        expect(slot.label?.id).toBe(dayLabelId);
        expect(slot.notes).toBeNull();
        expect(slot.sessions).toEqual([]);

        const week = await cleanupRaw.week.findUnique({
          where: { planId_startDate: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY } },
        });

        if (!week) {
          throw new Error("expected Week to be materialized");
        }

        const day = await cleanupRaw.day.findUnique({
          where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: "TUESDAY" } },
        });

        expect(day?.labelId).toBe(dayLabelId);
      } finally {
        await cleanupRaw.day
          .deleteMany({ where: { week: { planId: activePlanId } } })
          .catch(() => {});
        await cleanupRaw.week.deleteMany({ where: { planId: activePlanId } }).catch(() => {});
      }
    });

    it("returns an empty slot without materialization when labelId is null on unmaterialized Day (OQ-D)", async () => {
      const slot = await lmsDayMetadataApi.setLabel(
        coach.user.id,
        activePlanId,
        MONDAY_PARAM,
        "TUESDAY",
        { labelId: null },
      );

      expect(slot).toEqual({
        dayOfWeek: "TUESDAY",
        label: null,
        notes: null,
        sessions: [],
      });

      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });
      const dayCount = await cleanupRaw.day.count({
        where: { week: { planId: activePlanId } },
      });

      expect(weekCount).toBe(0);
      expect(dayCount).toBe(0);
    });

    it("clears the label on a materialized Day with setLabel(null), Day stays as breadcrumb", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY", labelId: dayLabelId },
      });

      try {
        const slot = await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "TUESDAY",
          { labelId: null },
        );

        expect(slot.label).toBeNull();

        const persisted = await cleanupRaw.day.findUnique({ where: { id: day.id } });

        expect(persisted).not.toBeNull();
        expect(persisted?.labelId).toBeNull();
      } finally {
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("preserves existing sessions when setting a label on the same Day", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const sessionA = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const sessionB = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 20, labelId: sessionLabelId },
      });

      try {
        const slot = await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "TUESDAY",
          { labelId: dayLabelId },
        );

        expect(slot.label?.id).toBe(dayLabelId);
        expect(slot.sessions).toHaveLength(2);
        expect(slot.sessions[0]?.order).toBe(10);
        expect(slot.sessions[0]?.label).toBeNull();
        expect(slot.sessions[1]?.order).toBe(20);
        expect(slot.sessions[1]?.label?.id).toBe(sessionLabelId);
      } finally {
        await cleanupRaw.session.delete({ where: { id: sessionA.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: sessionB.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("returns blocks carrying a populated schemas tree (DAY_INCLUDE embed)", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });
      const schema = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          order: 10,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });
      const row = await cleanupRaw.schemaRow.create({
        data: {
          schemaId: schema.id,
          order: 10,
          rowKind: "REST_SLOT",
          rowPayload: REST_SLOT_PAYLOAD,
        },
      });

      try {
        const slot = await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "TUESDAY",
          { labelId: dayLabelId },
        );

        const embedded = slot.sessions[0]?.blocks[0];

        expect(embedded?.id).toBe(block.id);
        expect(embedded?.schemas).toHaveLength(1);
        expect(embedded?.schemas[0]?.schema.id).toBe(schema.id);
        expect(embedded?.schemas[0]?.rows).toHaveLength(1);
        expect(embedded?.schemas[0]?.rows[0]?.id).toBe(row.id);
        expect(embedded?.schemas[0]?.subSchemas).toEqual([]);
      } finally {
        await cleanupRaw.schemaRow.deleteMany({ where: { schemaId: schema.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: schema.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("materializes Day inside an already-materialized Week without creating a new Week row", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });

      try {
        const slot = await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "WEDNESDAY",
          { labelId: dayLabelId },
        );

        expect(slot.dayOfWeek).toBe("WEDNESDAY");
        expect(slot.label?.id).toBe(dayLabelId);

        const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

        expect(weekCount).toBe(1);
      } finally {
        await cleanupRaw.day
          .deleteMany({ where: { week: { planId: activePlanId } } })
          .catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("persists Week.startDate as UTC-midnight Monday for a Wednesday param (TZ invariance)", async () => {
      try {
        await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          WEDNESDAY_PARAM,
          "WEDNESDAY",
          { labelId: dayLabelId },
        );

        const week = await cleanupRaw.week.findUnique({
          where: { planId_startDate: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY } },
        });

        if (!week) {
          throw new Error("expected Week to be materialized");
        }

        expect(week.startDate.getUTCFullYear()).toBe(2026);
        expect(week.startDate.getUTCMonth()).toBe(4);
        expect(week.startDate.getUTCDate()).toBe(18);
      } finally {
        await cleanupRaw.day
          .deleteMany({ where: { week: { planId: activePlanId } } })
          .catch(() => {});
        await cleanupRaw.week.deleteMany({ where: { planId: activePlanId } }).catch(() => {});
      }
    });
  });

  describe("setNotes", () => {
    it("materializes Week + Day on first call with a non-null notes value", async () => {
      try {
        const slot = await lmsDayMetadataApi.setNotes(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "MONDAY",
          { notes: "test notes" },
        );

        expect(slot.dayOfWeek).toBe("MONDAY");
        expect(slot.notes).toBe("test notes");
        expect(slot.label).toBeNull();
        expect(slot.sessions).toEqual([]);

        const week = await cleanupRaw.week.findUnique({
          where: { planId_startDate: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY } },
        });

        if (!week) {
          throw new Error("expected Week to be materialized");
        }

        const day = await cleanupRaw.day.findUnique({
          where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: "MONDAY" } },
        });

        expect(day?.notes).toBe("test notes");
      } finally {
        await cleanupRaw.day
          .deleteMany({ where: { week: { planId: activePlanId } } })
          .catch(() => {});
        await cleanupRaw.week.deleteMany({ where: { planId: activePlanId } }).catch(() => {});
      }
    });

    it("returns an empty slot without materialization when notes is null on unmaterialized Day (OQ-D)", async () => {
      const slot = await lmsDayMetadataApi.setNotes(
        coach.user.id,
        activePlanId,
        MONDAY_PARAM,
        "MONDAY",
        { notes: null },
      );

      expect(slot).toEqual({
        dayOfWeek: "MONDAY",
        label: null,
        notes: null,
        sessions: [],
      });

      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

      expect(weekCount).toBe(0);
    });

    it("composes with setLabel — setLabel then setNotes on same Day yields both fields", async () => {
      try {
        const afterLabel = await lmsDayMetadataApi.setLabel(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "FRIDAY",
          { labelId: dayLabelId },
        );

        expect(afterLabel.label?.id).toBe(dayLabelId);
        expect(afterLabel.notes).toBeNull();

        const afterNotes = await lmsDayMetadataApi.setNotes(
          coach.user.id,
          activePlanId,
          MONDAY_PARAM,
          "FRIDAY",
          { notes: "friday focus" },
        );

        expect(afterNotes.label?.id).toBe(dayLabelId);
        expect(afterNotes.notes).toBe("friday focus");
      } finally {
        await cleanupRaw.day
          .deleteMany({ where: { week: { planId: activePlanId } } })
          .catch(() => {});
        await cleanupRaw.week.deleteMany({ where: { planId: activePlanId } }).catch(() => {});
      }
    });

    it("rejects when caller does not own the plan, with no side-effect", async () => {
      await expect(
        lmsDayMetadataApi.setNotes(otherCoach.user.id, activePlanId, MONDAY_PARAM, "MONDAY", {
          notes: "tamper",
        }),
      ).rejects.toThrow(ForbiddenError);

      const weekCount = await cleanupRaw.week.count({ where: { planId: activePlanId } });

      expect(weekCount).toBe(0);
    });

    it("concurrent setLabel + setNotes on pre-materialized Day — both persist (different columns)", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "SATURDAY" },
      });

      try {
        const [labelResult, notesResult] = await Promise.allSettled([
          lmsDayMetadataApi.setLabel(coach.user.id, activePlanId, MONDAY_PARAM, "SATURDAY", {
            labelId: dayLabelId,
          }),
          lmsDayMetadataApi.setNotes(coach.user.id, activePlanId, MONDAY_PARAM, "SATURDAY", {
            notes: "saturday focus",
          }),
        ]);

        expect(labelResult.status === "fulfilled" || notesResult.status === "fulfilled").toBe(true);

        const stored = await cleanupRaw.day.findUnique({ where: { id: day.id } });

        if (labelResult.status === "fulfilled") {
          expect(stored?.labelId).toBe(dayLabelId);
        }

        if (notesResult.status === "fulfilled") {
          expect(stored?.notes).toBe("saturday focus");
        }
      } finally {
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });
  });
});
