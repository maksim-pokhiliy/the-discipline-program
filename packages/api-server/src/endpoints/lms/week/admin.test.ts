import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { BadRequestError, ForbiddenError, InternalServerError } from "@repo/errors";

import { cleanupRaw, createTestCoach } from "../../../test/helpers";
import { lmsSchemaApi } from "../schema/admin";
import { lmsSchemaRowApi } from "../schema-row/admin";

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

const N_ROUNDS_PARAMS = {
  archetype: "n-rounds" as const,
  params: { countForm: "exact" as const, count: 5 },
};

const NESTED_PARAMS = {
  archetype: "nested-rounds-over-rounds" as const,
  params: { outerCount: 3 },
};

const REST_SLOT_PAYLOAD = { rowKind: "REST_SLOT" as const };

describe("lmsWeekApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let atomicArchetypeId: string;
  let nestedArchetypeId: string;

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

    const atomic = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "n-rounds" },
      select: { id: true },
    });

    atomicArchetypeId = atomic.id;

    const nested = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "nested-rounds-over-rounds" },
      select: { id: true },
    });

    nestedArchetypeId = nested.id;
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

    it("embeds blocks per session with labels sorted by BlockLabelAssignment.order", async () => {
      const labelSuffix = crypto.randomUUID().slice(0, 8);
      const blockLabelFirst = await cleanupRaw.label.create({
        data: {
          name: `Block Label First ${labelSuffix}`,
          nameLower: `block label first ${labelSuffix}`,
          applicableLevels: ["BLOCK"],
        },
      });
      const blockLabelSecond = await cleanupRaw.label.create({
        data: {
          name: `Block Label Second ${labelSuffix}`,
          nameLower: `block label second ${labelSuffix}`,
          applicableLevels: ["BLOCK"],
        },
      });
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "TUESDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10 },
      });
      const blockFirst = await cleanupRaw.block.create({
        data: {
          sessionId: session.id,
          order: 10,
          intensity: { rpe: { value: 7 } },
          timeCap: { min: 10, max: 15, unit: "min" },
          notes: "first block",
        },
      });
      const blockSecond = await cleanupRaw.block.create({
        data: {
          sessionId: session.id,
          order: 20,
        },
      });

      await cleanupRaw.blockLabelAssignment.create({
        data: { blockId: blockFirst.id, labelId: blockLabelFirst.id, order: 10 },
      });
      await cleanupRaw.blockLabelAssignment.create({
        data: { blockId: blockFirst.id, labelId: blockLabelSecond.id, order: 20 },
      });
      await cleanupRaw.blockLabelAssignment.create({
        data: { blockId: blockSecond.id, labelId: blockLabelFirst.id, order: 10 },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const tuesday = result.days[1];

        expect(tuesday?.dayOfWeek).toBe("TUESDAY");
        expect(tuesday?.sessions).toHaveLength(1);

        const blocks = tuesday?.sessions[0]?.blocks ?? [];

        expect(blocks).toHaveLength(2);
        expect(blocks[0]?.id).toBe(blockFirst.id);
        expect(blocks[0]?.order).toBe(10);
        expect(blocks[0]?.intensity).toEqual({ rpe: { value: 7 } });
        expect(blocks[0]?.timeCap).toEqual({ min: 10, max: 15, unit: "min" });
        expect(blocks[0]?.notes).toBe("first block");
        expect(blocks[0]?.labels).toHaveLength(2);
        expect(blocks[0]?.labels[0]?.id).toBe(blockLabelFirst.id);
        expect(blocks[0]?.labels[1]?.id).toBe(blockLabelSecond.id);

        expect(blocks[1]?.id).toBe(blockSecond.id);
        expect(blocks[1]?.order).toBe(20);
        expect(blocks[1]?.intensity).toBeNull();
        expect(blocks[1]?.timeCap).toBeNull();
        expect(blocks[1]?.notes).toBeNull();
        expect(blocks[1]?.labels).toHaveLength(1);
        expect(blocks[1]?.labels[0]?.id).toBe(blockLabelFirst.id);
      } finally {
        await cleanupRaw.blockLabelAssignment
          .deleteMany({ where: { blockId: { in: [blockFirst.id, blockSecond.id] } } })
          .catch(() => {});
        await cleanupRaw.block.delete({ where: { id: blockFirst.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: blockSecond.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
        await cleanupRaw.label.delete({ where: { id: blockLabelFirst.id } }).catch(() => {});
        await cleanupRaw.label.delete({ where: { id: blockLabelSecond.id } }).catch(() => {});
      }
    });

    it("returns blocks: [] for a session without any blocks", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "FRIDAY" },
      });
      const session = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10 },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const friday = result.days[4];

        expect(friday?.dayOfWeek).toBe("FRIDAY");
        expect(friday?.sessions).toHaveLength(1);
        expect(friday?.sessions[0]?.blocks).toEqual([]);
      } finally {
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("isolates blocks across sessions on the same day", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "SATURDAY" },
      });
      const sessionA = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 10 },
      });
      const sessionB = await cleanupRaw.session.create({
        data: { dayId: day.id, order: 20 },
      });
      const blockA1 = await cleanupRaw.block.create({
        data: { sessionId: sessionA.id, order: 10 },
      });
      const blockA2 = await cleanupRaw.block.create({
        data: { sessionId: sessionA.id, order: 20 },
      });
      const blockB = await cleanupRaw.block.create({
        data: { sessionId: sessionB.id, order: 10 },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const saturday = result.days[5];

        expect(saturday?.dayOfWeek).toBe("SATURDAY");
        expect(saturday?.sessions).toHaveLength(2);

        const sessionAResponse = saturday?.sessions[0];
        const sessionBResponse = saturday?.sessions[1];

        expect(sessionAResponse?.id).toBe(sessionA.id);
        expect(sessionAResponse?.blocks).toHaveLength(2);
        expect(sessionAResponse?.blocks.map((b) => b.id)).toEqual([blockA1.id, blockA2.id]);
        expect(sessionAResponse?.blocks.every((b) => b.sessionId === sessionA.id)).toBe(true);

        expect(sessionBResponse?.id).toBe(sessionB.id);
        expect(sessionBResponse?.blocks).toHaveLength(1);
        expect(sessionBResponse?.blocks[0]?.id).toBe(blockB.id);
        expect(sessionBResponse?.blocks[0]?.sessionId).toBe(sessionB.id);
      } finally {
        await cleanupRaw.block.delete({ where: { id: blockA1.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: blockA2.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: blockB.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: sessionA.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: sessionB.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("embeds a top-level schema with its rows under the block", async () => {
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
      const rowFirst = await cleanupRaw.schemaRow.create({
        data: {
          schemaId: schema.id,
          order: 10,
          rowKind: "REST_SLOT",
          rowPayload: REST_SLOT_PAYLOAD,
        },
      });
      const rowSecond = await cleanupRaw.schemaRow.create({
        data: {
          schemaId: schema.id,
          order: 20,
          rowKind: "REST_SLOT",
          rowPayload: REST_SLOT_PAYLOAD,
        },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const embedded = result.days[1]?.sessions[0]?.blocks[0];

        expect(embedded?.id).toBe(block.id);
        expect(embedded?.schemas).toHaveLength(1);
        expect(embedded?.schemas[0]?.schema.id).toBe(schema.id);
        expect(embedded?.schemas[0]?.schema.kind).toBe("ATOMIC");
        expect(embedded?.schemas[0]?.rows).toHaveLength(2);
        expect(embedded?.schemas[0]?.rows.map((r) => r.id)).toEqual([rowFirst.id, rowSecond.id]);
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

    it("nests a depth-2 sub-schema under subSchemas and not at the top level", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "WEDNESDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });
      const parent = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          order: 10,
          kind: "NESTED",
          archetypeId: nestedArchetypeId,
          archetypeParams: NESTED_PARAMS,
        },
      });
      const child = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          parentSchemaId: parent.id,
          order: 10,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const embedded = result.days[2]?.sessions[0]?.blocks[0];

        expect(embedded?.schemas).toHaveLength(1);
        expect(embedded?.schemas[0]?.schema.id).toBe(parent.id);
        expect(embedded?.schemas[0]?.subSchemas).toHaveLength(1);
        expect(embedded?.schemas[0]?.subSchemas[0]?.schema.id).toBe(child.id);
        expect(embedded?.schemas.map((s) => s.schema.id)).not.toContain(child.id);
      } finally {
        await cleanupRaw.schema.delete({ where: { id: child.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: parent.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("returns schemas: [] and alternatingGroups: [] for a block without an embed tree", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "THURSDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const embedded = result.days[3]?.sessions[0]?.blocks[0];

        expect(embedded?.id).toBe(block.id);
        expect(embedded?.schemas).toEqual([]);
        expect(embedded?.alternatingGroups).toEqual([]);
      } finally {
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("returns schemas, rows and subSchemas each sorted ascending by order", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "FRIDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });
      const schemaLater = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          order: 20,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });
      const schemaEarlier = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          order: 10,
          kind: "NESTED",
          archetypeId: nestedArchetypeId,
          archetypeParams: NESTED_PARAMS,
        },
      });
      const subLater = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          parentSchemaId: schemaEarlier.id,
          order: 20,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });
      const subEarlier = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          parentSchemaId: schemaEarlier.id,
          order: 10,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });
      const rowLater = await cleanupRaw.schemaRow.create({
        data: {
          schemaId: schemaLater.id,
          order: 20,
          rowKind: "REST_SLOT",
          rowPayload: REST_SLOT_PAYLOAD,
        },
      });
      const rowEarlier = await cleanupRaw.schemaRow.create({
        data: {
          schemaId: schemaLater.id,
          order: 10,
          rowKind: "REST_SLOT",
          rowPayload: REST_SLOT_PAYLOAD,
        },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const embedded = result.days[4]?.sessions[0]?.blocks[0];
        const nested = embedded?.schemas[0];

        expect(embedded?.schemas.map((s) => s.schema.order)).toEqual([10, 20]);
        expect(embedded?.schemas.map((s) => s.schema.id)).toEqual([
          schemaEarlier.id,
          schemaLater.id,
        ]);
        expect(nested?.subSchemas.map((s) => s.schema.order)).toEqual([10, 20]);
        expect(nested?.subSchemas.map((s) => s.schema.id)).toEqual([subEarlier.id, subLater.id]);
        expect(embedded?.schemas[1]?.rows.map((r) => r.order)).toEqual([10, 20]);
        expect(embedded?.schemas[1]?.rows.map((r) => r.id)).toEqual([rowEarlier.id, rowLater.id]);
      } finally {
        await cleanupRaw.schemaRow
          .deleteMany({ where: { schemaId: schemaLater.id } })
          .catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: subEarlier.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: subLater.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: schemaEarlier.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: schemaLater.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });

    it("embeds an alternating group whose schemaIds are a subset of the block's schemas", async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "SATURDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });
      const group = await cleanupRaw.alternatingGroup.create({
        data: { blockId: block.id, relationKind: "ALTERNATING_SETS" },
      });
      const memberFirst = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          alternatingGroupId: group.id,
          order: 10,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });
      const memberSecond = await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          alternatingGroupId: group.id,
          order: 20,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
        },
      });

      try {
        const result = await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, MONDAY_PARAM);

        const embedded = result.days[5]?.sessions[0]?.blocks[0];

        expect(embedded?.alternatingGroups).toHaveLength(1);
        expect(embedded?.alternatingGroups[0]?.id).toBe(group.id);
        expect([...(embedded?.alternatingGroups[0]?.schemaIds ?? [])].sort()).toEqual(
          [memberFirst.id, memberSecond.id].sort(),
        );

        const embeddedSchemaIds = new Set(embedded?.schemas.map((s) => s.schema.id));

        expect(
          embedded?.alternatingGroups[0]?.schemaIds.every((id) => embeddedSchemaIds.has(id)),
        ).toBe(true);
      } finally {
        await cleanupRaw.schema.delete({ where: { id: memberFirst.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: memberSecond.id } }).catch(() => {});
        await cleanupRaw.alternatingGroup.delete({ where: { id: group.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      }
    });
  });

  describe("getByPlanAndDate — composition collision (QA-001 write-guard, read-time DbCorruption)", () => {
    const COLLISION_MONDAY_PARAM = "2026-06-01";
    const COLLISION_UTC_MONDAY = new Date(Date.UTC(2026, 5, 1));
    const LADDER_COMPOSITION: Composition = {
      repetition: { kind: "ladder", steps: [21, 15, 9] },
    };
    const MARKER_PAYLOAD = { rowKind: "INNER_LADDER_MARKER" as const, steps: [21, 15, 9] };

    const provisionCollisionWeek = async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: COLLISION_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MONDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });

      return {
        block,
        cleanup: async () => {
          await cleanupRaw.schemaRow
            .deleteMany({ where: { schema: { blockId: block.id } } })
            .catch(() => {});
          await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
          await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
        },
      };
    };

    it("rejects a ladder-collision marker-row create with 400 and persists no corruption", async () => {
      const ctx = await provisionCollisionWeek();

      try {
        const schema = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: N_ROUNDS_PARAMS,
            composition: LADDER_COMPOSITION,
          },
        );

        expect(schema.composition).toEqual(LADDER_COMPOSITION);

        await expect(
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: schema.id,
            rowKind: "INNER_LADDER_MARKER",
            rowPayload: MARKER_PAYLOAD,
          }),
        ).rejects.toThrow(BadRequestError);

        const result = await lmsWeekApi.getByPlanAndDate(
          coach.user.id,
          activePlanId,
          COLLISION_MONDAY_PARAM,
        );

        expect(result.week).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("500s the WHOLE week even when a sibling schema is collision-free (QA-002 no per-block isolation)", async () => {
      const ctx = await provisionCollisionWeek();

      try {
        const cleanSchema = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: N_ROUNDS_PARAMS },
        );

        expect(cleanSchema.composition).toBeNull();

        const collidingSchema = await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            order: 20,
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: N_ROUNDS_PARAMS,
            composition: LADDER_COMPOSITION,
          },
        });

        await cleanupRaw.schemaRow.create({
          data: {
            schemaId: collidingSchema.id,
            order: 10,
            rowKind: "INNER_LADDER_MARKER",
            rowPayload: MARKER_PAYLOAD,
          },
        });

        await expect(
          lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, COLLISION_MONDAY_PARAM),
        ).rejects.toThrow(InternalServerError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("surfaces a malformed single-node composition column as a 500 DbCorruption", async () => {
      const ctx = await provisionCollisionWeek();

      await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 10,
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: N_ROUNDS_PARAMS,
          composition: { repetition: { kind: "ladder" } },
        },
      });

      try {
        await expect(
          lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, COLLISION_MONDAY_PARAM),
        ).rejects.toThrow(InternalServerError);

        try {
          await lmsWeekApi.getByPlanAndDate(coach.user.id, activePlanId, COLLISION_MONDAY_PARAM);
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerError);

          if (error instanceof InternalServerError) {
            expect(error.statusCode).toBe(500);
            expect(error.details?.kind).toBe("DbCorruption");
          }
        }
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("getByPlanAndDate — composition-only round-trip (DR-1, QA-101 acceptance)", () => {
    const COMPOSITION_MONDAY_PARAM = "2026-06-08";
    const COMPOSITION_UTC_MONDAY = new Date(Date.UTC(2026, 5, 8));
    const CADENCE_COMPOSITION: Composition = {
      repetition: { kind: "cadence", everyMin: 1, rounds: 4 },
    };
    const REST_ROW_PAYLOAD = { rowKind: "REST_SLOT" as const };

    const provisionCompositionWeek = async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: activePlanId, startDate: COMPOSITION_UTC_MONDAY },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MONDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 10 },
      });

      return {
        block,
        cleanup: async () => {
          await cleanupRaw.schemaRow
            .deleteMany({ where: { schema: { blockId: block.id } } })
            .catch(() => {});
          await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
          await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
        },
      };
    };

    it("creates a composition-only Schema whose create-return carries a null triad and a derived label", async () => {
      const ctx = await provisionCompositionWeek();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { composition: CADENCE_COMPOSITION },
        );

        expect(created.kind).toBeNull();
        expect(created.archetypeId).toBeNull();
        expect(created.archetypeParams).toBeNull();
        expect(created.composition).toEqual(CADENCE_COMPOSITION);
        expect(created.label).toEqual(deriveCompositionLabel(CADENCE_COMPOSITION));

        const stored = await cleanupRaw.schema.findUnique({ where: { id: created.id } });

        expect(stored?.kind).toBeNull();
        expect(stored?.archetypeId).toBeNull();
        expect(stored?.archetypeParams).toBeNull();
        expect(stored?.composition).toEqual(CADENCE_COMPOSITION);
      } finally {
        await ctx.cleanup();
      }
    });

    it("reads the composition-only Schema back through the week read with no 500 and a null triad", async () => {
      const ctx = await provisionCompositionWeek();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { composition: CADENCE_COMPOSITION, header: "EMOM 4" },
        );

        await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: created.id,
          rowKind: "REST_SLOT",
          rowPayload: REST_ROW_PAYLOAD,
        });
        await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: created.id,
          rowKind: "REST_SLOT",
          rowPayload: REST_ROW_PAYLOAD,
        });

        const result = await lmsWeekApi.getByPlanAndDate(
          coach.user.id,
          activePlanId,
          COMPOSITION_MONDAY_PARAM,
        );

        expect(result.week).not.toBeNull();

        const embedded = result.days[0]?.sessions[0]?.blocks[0]?.schemas[0];

        expect(embedded?.schema.id).toBe(created.id);
        expect(embedded?.schema.kind).toBeNull();
        expect(embedded?.schema.archetypeId).toBeNull();
        expect(embedded?.schema.archetypeParams).toBeNull();
        expect(embedded?.schema.composition).toEqual(CADENCE_COMPOSITION);
        expect(embedded?.schema.label).toEqual(deriveCompositionLabel(CADENCE_COMPOSITION));
        expect(embedded?.schema.header).toBe("EMOM 4");
        expect(embedded?.rows).toHaveLength(2);
        expect(embedded?.subSchemas).toEqual([]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("renders a week that mixes a composition-only Schema and an archetype Schema without a 500", async () => {
      const ctx = await provisionCompositionWeek();

      try {
        const compositionOnly = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { composition: CADENCE_COMPOSITION },
        );
        const archetype = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: N_ROUNDS_PARAMS },
        );

        const result = await lmsWeekApi.getByPlanAndDate(
          coach.user.id,
          activePlanId,
          COMPOSITION_MONDAY_PARAM,
        );

        const schemas = result.days[0]?.sessions[0]?.blocks[0]?.schemas ?? [];
        const compositionNode = schemas.find((s) => s.schema.id === compositionOnly.id);
        const archetypeNode = schemas.find((s) => s.schema.id === archetype.id);

        expect(compositionNode?.schema.kind).toBeNull();
        expect(compositionNode?.schema.archetypeParams).toBeNull();
        expect(archetypeNode?.schema.kind).toBe("ATOMIC");
        expect(archetypeNode?.schema.archetypeParams).toEqual(N_ROUNDS_PARAMS);
        expect(archetypeNode?.schema.composition).toBeNull();
      } finally {
        await ctx.cleanup();
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
