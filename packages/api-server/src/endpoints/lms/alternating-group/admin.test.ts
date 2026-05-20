import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsAlternatingGroupApi } from "./admin";

const ALTERNATING_SETS_PARAMS = (setEnumeration: number[]) => ({
  archetype: "alternating-sets" as const,
  params: { setEnumeration },
});

const N_ROUNDS_PARAMS = {
  archetype: "n-rounds" as const,
  params: { countForm: "exact" as const, count: 5 },
};

const NESTED_PARAMS = {
  archetype: "nested-rounds-over-rounds" as const,
  params: { outerCount: 3 },
};

const MISSING_ID = "clz0000000000000000000000";

describe("lmsAlternatingGroupApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let headCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let admin: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let alternatingSetsArchetypeId: string;
  let nRoundsArchetypeId: string;
  let nestedArchetypeId: string;

  let orderCounter = 0;
  let weekCounter = 0;

  const provisionBlock = async (options: { planId?: string } = {}) => {
    const planId = options.planId ?? activePlanId;

    weekCounter += 1;

    const startDate = new Date(Date.UTC(2026, 0, 1));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    const week = await cleanupRaw.week.create({
      data: { planId, startDate },
    });
    const day = await cleanupRaw.day.create({
      data: { weekId: week.id, dayOfWeek: "WEDNESDAY" },
    });
    const session = await cleanupRaw.session.create({
      data: { dayId: day.id, order: 10 },
    });
    const block = await cleanupRaw.block.create({
      data: { sessionId: session.id, order: 10 },
    });

    return {
      week,
      day,
      session,
      block,
      cleanup: async () => {
        await cleanupRaw.alternatingGroup
          .deleteMany({ where: { blockId: block.id } })
          .catch(() => {});
        await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      },
    };
  };

  const createAlternatingSetsSchema = async (options: {
    blockId: string;
    parentSchemaId?: string;
    alternatingGroupId?: string;
    setEnumeration?: number[];
  }) => {
    orderCounter += 1;

    return cleanupRaw.schema.create({
      data: {
        blockId: options.blockId,
        parentSchemaId: options.parentSchemaId ?? null,
        alternatingGroupId: options.alternatingGroupId ?? null,
        order: orderCounter,
        kind: "ATOMIC",
        archetypeId: alternatingSetsArchetypeId,
        archetypeParams: ALTERNATING_SETS_PARAMS(options.setEnumeration ?? [1, 3, 5]),
      },
    });
  };

  const createNRoundsSchema = async (blockId: string) => {
    orderCounter += 1;

    return cleanupRaw.schema.create({
      data: {
        blockId,
        order: orderCounter,
        kind: "ATOMIC",
        archetypeId: nRoundsArchetypeId,
        archetypeParams: N_ROUNDS_PARAMS,
      },
    });
  };

  const createNestedParentSchema = async (blockId: string) => {
    orderCounter += 1;

    return cleanupRaw.schema.create({
      data: {
        blockId,
        order: orderCounter,
        kind: "NESTED",
        archetypeId: nestedArchetypeId,
        archetypeParams: NESTED_PARAMS,
      },
    });
  };

  type SeededMember = { id: string };
  type SeededGroup<T extends readonly SeededMember[]> = { group: { id: string }; members: T };

  async function seedGroup(
    blockId: string,
    memberCount: 2,
  ): Promise<SeededGroup<[SeededMember, SeededMember]>>;
  async function seedGroup(
    blockId: string,
    memberCount: 3,
  ): Promise<SeededGroup<[SeededMember, SeededMember, SeededMember]>>;
  async function seedGroup(
    blockId: string,
    memberCount: 2 | 3,
  ): Promise<
    | SeededGroup<[SeededMember, SeededMember]>
    | SeededGroup<[SeededMember, SeededMember, SeededMember]>
  > {
    const group = await cleanupRaw.alternatingGroup.create({
      data: { blockId, relationKind: "ALTERNATING_SETS" },
    });

    const memberA = await createAlternatingSetsSchema({ blockId, alternatingGroupId: group.id });
    const memberB = await createAlternatingSetsSchema({ blockId, alternatingGroupId: group.id });

    if (memberCount === 2) {
      return { group, members: [{ id: memberA.id }, { id: memberB.id }] };
    }

    const memberC = await createAlternatingSetsSchema({ blockId, alternatingGroupId: group.id });

    return { group, members: [{ id: memberA.id }, { id: memberB.id }, { id: memberC.id }] };
  }

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    headCoach = await createTestCoach();
    admin = await createTestCoach();

    const preexisting = await cleanupRaw.user.findMany({
      where: { role: "HEAD_COACH" },
      select: { id: true },
    });

    for (const hc of preexisting) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: "COACH" },
      });
    }

    await cleanupRaw.user.update({
      where: { id: headCoach.user.id },
      data: { role: "HEAD_COACH" },
    });

    await cleanupRaw.user.update({
      where: { id: admin.user.id },
      data: { role: "ADMIN" },
    });

    const activePlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "Alternating Group Test Archived Plan",
        status: "ARCHIVED",
      },
    });

    archivedPlanId = archivedPlan.id;

    const alternatingSets = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "alternating-sets" },
      select: { id: true },
    });

    alternatingSetsArchetypeId = alternatingSets.id;

    const nRounds = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "n-rounds" },
      select: { id: true },
    });

    nRoundsArchetypeId = nRounds.id;

    const nested = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "nested-rounds-over-rounds" },
      select: { id: true },
    });

    nestedArchetypeId = nested.id;
  });

  afterAll(async () => {
    await cleanupRaw.alternatingGroup
      .deleteMany({
        where: {
          block: {
            session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } },
          },
        },
      })
      .catch(() => {});
    await cleanupRaw.schema
      .deleteMany({
        where: {
          block: { session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } },
        },
      })
      .catch(() => {});
    await cleanupRaw.block
      .deleteMany({
        where: { session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } },
      })
      .catch(() => {});
    await cleanupRaw.session
      .deleteMany({ where: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } })
      .catch(() => {});
    await cleanupRaw.day
      .deleteMany({ where: { week: { planId: { in: [activePlanId, archivedPlanId] } } } })
      .catch(() => {});
    await cleanupRaw.week
      .deleteMany({ where: { planId: { in: [activePlanId, archivedPlanId] } } })
      .catch(() => {});

    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});

    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: headCoach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: admin.profile.id } }).catch(() => {});

    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: headCoach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: admin.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("creates a group with the member schemaIds populated on the happy path", async () => {
      const ctx = await provisionBlock();
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        const created = await lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
          relationKind: "ALTERNATING_SETS",
          schemaIds: [memberA.id, memberB.id],
        });

        expect(created.blockId).toBe(ctx.block.id);
        expect(created.relationKind).toBe("ALTERNATING_SETS");
        expect([...created.schemaIds].sort()).toEqual([memberA.id, memberB.id].sort());

        const stored = await cleanupRaw.schema.findMany({
          where: { id: { in: [memberA.id, memberB.id] } },
          select: { alternatingGroupId: true },
        });

        expect(stored.every((s) => s.alternatingGroupId === created.id)).toBe(true);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when a member schema does not exist (NotFoundError)", async () => {
      const ctx = await provisionBlock();
      const member = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [member.id, MISSING_ID],
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when a member schema belongs to a different plan (NotFoundError)", async () => {
      const ctx = await provisionBlock();
      const otherPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const otherCtx = await provisionBlock({ planId: otherPlan.id });
      const memberInPlan = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberOutsidePlan = await createAlternatingSetsSchema({ blockId: otherCtx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [memberInPlan.id, memberOutsidePlan.id],
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await otherCtx.cleanup();
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });

    it("rejects members spanning two blocks (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const otherCtx = await provisionBlock();
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: otherCtx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [memberA.id, memberB.id],
          }),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await otherCtx.cleanup();
        await ctx.cleanup();
      }
    });

    it("rejects a member that is a sub-schema (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const parent = await createNestedParentSchema(ctx.block.id);
      const topLevel = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const subSchema = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        parentSchemaId: parent.id,
      });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [topLevel.id, subSchema.id],
          }),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a member whose archetype is not alternating-sets (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const alternating = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const nRounds = await createNRoundsSchema(ctx.block.id);

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [alternating.id, nRounds.id],
          }),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a member that already belongs to another group (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const { members } = await seedGroup(ctx.block.id, 2);
      const freeMember = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [freeMember.id, members[0].id],
          }),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the caller does not own the plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock();
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.create(otherCoach.user.id, activePlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [memberA.id, memberB.id],
          }),
        ).rejects.toThrow(ForbiddenError);

        const count = await cleanupRaw.alternatingGroup.count({
          where: { blockId: ctx.block.id },
        });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows a head-coach to create a group in another coach's plan", async () => {
      const ctx = await provisionBlock();
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        const created = await lmsAlternatingGroupApi.create(headCoach.user.id, activePlanId, {
          relationKind: "ALTERNATING_SETS",
          schemaIds: [memberA.id, memberB.id],
        });

        expect(created.blockId).toBe(ctx.block.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows an admin to create a group in another coach's plan", async () => {
      const ctx = await provisionBlock();
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        const created = await lmsAlternatingGroupApi.create(admin.user.id, activePlanId, {
          relationKind: "ALTERNATING_SETS",
          schemaIds: [memberA.id, memberB.id],
        });

        expect(created.blockId).toBe(ctx.block.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects creation on an archived plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, archivedPlanId, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [memberA.id, memberB.id],
          }),
        ).rejects.toThrow(ForbiddenError);

        const count = await cleanupRaw.alternatingGroup.count({
          where: { blockId: ctx.block.id },
        });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects creation when the plan is soft-deleted (NotFoundError)", async () => {
      const softDeletedPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const ctx = await provisionBlock({ planId: softDeletedPlan.id });
      const memberA = await createAlternatingSetsSchema({ blockId: ctx.block.id });
      const memberB = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      await cleanupRaw.trainingPlan.update({
        where: { id: softDeletedPlan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(
          lmsAlternatingGroupApi.create(coach.user.id, softDeletedPlan.id, {
            relationKind: "ALTERNATING_SETS",
            schemaIds: [memberA.id, memberB.id],
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await cleanupRaw.trainingPlan.update({
          where: { id: softDeletedPlan.id },
          data: { deletedAt: null },
        });
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: softDeletedPlan.id } }).catch(() => {});
      }
    });
  });

  describe("addMember", () => {
    it("adds a schema as a new member on the happy path", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const newMember = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        const updated = await lmsAlternatingGroupApi.addMember(
          coach.user.id,
          group.id,
          newMember.id,
        );

        expect(updated.schemaIds).toContain(newMember.id);
        expect(updated.schemaIds).toHaveLength(3);

        const stored = await cleanupRaw.schema.findUnique({
          where: { id: newMember.id },
          select: { alternatingGroupId: true },
        });

        expect(stored?.alternatingGroupId).toBe(group.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a schema already a member of this group (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const { group, members } = await seedGroup(ctx.block.id, 2);

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, members[0].id),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a schema that belongs to another group (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const otherGroup = await seedGroup(ctx.block.id, 2);

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, otherGroup.members[0].id),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a schema from a different block (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const otherCtx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const crossBlockSchema = await createAlternatingSetsSchema({ blockId: otherCtx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, crossBlockSchema.id),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await otherCtx.cleanup();
        await ctx.cleanup();
      }
    });

    it("rejects a schema whose archetype is not alternating-sets (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const nRounds = await createNRoundsSchema(ctx.block.id);

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, nRounds.id),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a schema that is a sub-schema (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const parent = await createNestedParentSchema(ctx.block.id);
      const subSchema = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        parentSchemaId: parent.id,
      });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, subSchema.id),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the group does not exist (NotFoundError)", async () => {
      const ctx = await provisionBlock();
      const schema = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, MISSING_ID, schema.id),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the schema does not exist (NotFoundError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, MISSING_ID),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the caller does not own the plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const newMember = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(otherCoach.user.id, group.id, newMember.id),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schema.findUnique({
          where: { id: newMember.id },
          select: { alternatingGroupId: true },
        });

        expect(stored?.alternatingGroupId).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows a head-coach to add a member in another coach's plan", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const newMember = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        const updated = await lmsAlternatingGroupApi.addMember(
          headCoach.user.id,
          group.id,
          newMember.id,
        );

        expect(updated.schemaIds).toContain(newMember.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects adding a member on an archived plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });
      const { group } = await seedGroup(ctx.block.id, 2);
      const newMember = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, newMember.id),
        ).rejects.toThrow(ForbiddenError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects adding a member when the plan is soft-deleted (NotFoundError)", async () => {
      const softDeletedPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const ctx = await provisionBlock({ planId: softDeletedPlan.id });
      const { group } = await seedGroup(ctx.block.id, 2);
      const newMember = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      await cleanupRaw.trainingPlan.update({
        where: { id: softDeletedPlan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, newMember.id),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await cleanupRaw.trainingPlan.update({
          where: { id: softDeletedPlan.id },
          data: { deletedAt: null },
        });
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: softDeletedPlan.id } }).catch(() => {});
      }
    });

    it("rejects a schema that lives in another plan owned by the same coach (NotFoundError)", async () => {
      const groupCtx = await provisionBlock();
      const otherPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const schemaCtx = await provisionBlock({ planId: otherPlan.id });
      const { group } = await seedGroup(groupCtx.block.id, 2);
      const crossPlanMember = await createAlternatingSetsSchema({ blockId: schemaCtx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.addMember(coach.user.id, group.id, crossPlanMember.id),
        ).rejects.toThrow(NotFoundError);

        const stored = await cleanupRaw.schema.findUnique({
          where: { id: crossPlanMember.id },
          select: { alternatingGroupId: true },
        });

        expect(stored?.alternatingGroupId).toBeNull();
      } finally {
        await schemaCtx.cleanup();
        await groupCtx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });
  });

  describe("removeMember", () => {
    it("rejects removing a schema that is not a member (BadRequestError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);
      const outsider = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.removeMember(coach.user.id, group.id, outsider.id),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("nulls the removed member and keeps the group alive when 3 members shrink to 2", async () => {
      const ctx = await provisionBlock();
      const { group, members } = await seedGroup(ctx.block.id, 3);

      try {
        const updated = await lmsAlternatingGroupApi.removeMember(
          coach.user.id,
          group.id,
          members[0].id,
        );

        expect(updated).not.toBeNull();
        expect(updated?.schemaIds).toHaveLength(2);
        expect(updated?.schemaIds).not.toContain(members[0].id);

        const removed = await cleanupRaw.schema.findUnique({
          where: { id: members[0].id },
          select: { alternatingGroupId: true },
        });

        expect(removed?.alternatingGroupId).toBeNull();

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });

        expect(groupAfter).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("dissolves the group and nulls both members when a 2-member group loses one", async () => {
      const ctx = await provisionBlock();
      const { group, members } = await seedGroup(ctx.block.id, 2);

      try {
        const result = await lmsAlternatingGroupApi.removeMember(
          coach.user.id,
          group.id,
          members[0].id,
        );

        expect(result).toBeNull();

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });

        expect(groupAfter).toBeNull();

        const schemasAfter = await cleanupRaw.schema.findMany({
          where: { id: { in: [members[0].id, members[1].id] } },
          select: { id: true, alternatingGroupId: true },
        });

        expect(schemasAfter).toHaveLength(2);
        expect(schemasAfter.every((s) => s.alternatingGroupId === null)).toBe(true);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the group does not exist (NotFoundError)", async () => {
      const ctx = await provisionBlock();
      const schema = await createAlternatingSetsSchema({ blockId: ctx.block.id });

      try {
        await expect(
          lmsAlternatingGroupApi.removeMember(coach.user.id, MISSING_ID, schema.id),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the caller does not own the plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock();
      const { group, members } = await seedGroup(ctx.block.id, 3);

      try {
        await expect(
          lmsAlternatingGroupApi.removeMember(otherCoach.user.id, group.id, members[0].id),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schema.findUnique({
          where: { id: members[0].id },
          select: { alternatingGroupId: true },
        });

        expect(stored?.alternatingGroupId).toBe(group.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows a head-coach to remove a member in another coach's plan", async () => {
      const ctx = await provisionBlock();
      const { group, members } = await seedGroup(ctx.block.id, 3);

      try {
        const updated = await lmsAlternatingGroupApi.removeMember(
          headCoach.user.id,
          group.id,
          members[0].id,
        );

        expect(updated?.schemaIds).toHaveLength(2);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects removing a member on an archived plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });
      const { group, members } = await seedGroup(ctx.block.id, 3);

      try {
        await expect(
          lmsAlternatingGroupApi.removeMember(coach.user.id, group.id, members[0].id),
        ).rejects.toThrow(ForbiddenError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects removing a member when the plan is soft-deleted (NotFoundError)", async () => {
      const softDeletedPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const ctx = await provisionBlock({ planId: softDeletedPlan.id });
      const { group, members } = await seedGroup(ctx.block.id, 3);

      await cleanupRaw.trainingPlan.update({
        where: { id: softDeletedPlan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(
          lmsAlternatingGroupApi.removeMember(coach.user.id, group.id, members[0].id),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await cleanupRaw.trainingPlan.update({
          where: { id: softDeletedPlan.id },
          data: { deletedAt: null },
        });
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: softDeletedPlan.id } }).catch(() => {});
      }
    });

    it("dissolves a degenerate 1-member orphan group on the first removeMember call", async () => {
      const ctx = await provisionBlock();
      const orphanGroup = await cleanupRaw.alternatingGroup.create({
        data: { blockId: ctx.block.id, relationKind: "ALTERNATING_SETS" },
      });
      const soleMember = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: orphanGroup.id,
      });

      try {
        const result = await lmsAlternatingGroupApi.removeMember(
          coach.user.id,
          orphanGroup.id,
          soleMember.id,
        );

        expect(result).toBeNull();

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: orphanGroup.id },
        });

        expect(groupAfter).toBeNull();

        const memberAfter = await cleanupRaw.schema.findUnique({
          where: { id: soleMember.id },
          select: { id: true, alternatingGroupId: true },
        });

        expect(memberAfter).not.toBeNull();
        expect(memberAfter?.alternatingGroupId).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("delete", () => {
    it("removes the group and leaves all members alive with alternatingGroupId nulled", async () => {
      const ctx = await provisionBlock();
      const { group, members } = await seedGroup(ctx.block.id, 3);

      try {
        await lmsAlternatingGroupApi.delete(coach.user.id, group.id);

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });

        expect(groupAfter).toBeNull();

        const schemasAfter = await cleanupRaw.schema.findMany({
          where: { id: { in: members.map((m) => m.id) } },
          select: { id: true, alternatingGroupId: true },
        });

        expect(schemasAfter).toHaveLength(3);
        expect(schemasAfter.every((s) => s.alternatingGroupId === null)).toBe(true);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when the group does not exist (NotFoundError)", async () => {
      await expect(lmsAlternatingGroupApi.delete(coach.user.id, MISSING_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("rejects when the caller does not own the plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);

      try {
        await expect(lmsAlternatingGroupApi.delete(otherCoach.user.id, group.id)).rejects.toThrow(
          ForbiddenError,
        );

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });

        expect(groupAfter).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows a head-coach to delete a group in another coach's plan", async () => {
      const ctx = await provisionBlock();
      const { group } = await seedGroup(ctx.block.id, 2);

      try {
        await lmsAlternatingGroupApi.delete(headCoach.user.id, group.id);

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });

        expect(groupAfter).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects deleting a group on an archived plan (ForbiddenError)", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });
      const { group } = await seedGroup(ctx.block.id, 2);

      try {
        await expect(lmsAlternatingGroupApi.delete(coach.user.id, group.id)).rejects.toThrow(
          ForbiddenError,
        );
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects deleting a group when the plan is soft-deleted (NotFoundError)", async () => {
      const softDeletedPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const ctx = await provisionBlock({ planId: softDeletedPlan.id });
      const { group } = await seedGroup(ctx.block.id, 2);

      await cleanupRaw.trainingPlan.update({
        where: { id: softDeletedPlan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(lmsAlternatingGroupApi.delete(coach.user.id, group.id)).rejects.toThrow(
          NotFoundError,
        );
      } finally {
        await cleanupRaw.trainingPlan.update({
          where: { id: softDeletedPlan.id },
          data: { deletedAt: null },
        });
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: softDeletedPlan.id } }).catch(() => {});
      }
    });
  });

  describe("mapper determinism", () => {
    it("returns schemaIds in ascending order regardless of member insertion order", async () => {
      const ctx = await provisionBlock();

      const highOrder = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 900,
          kind: "ATOMIC",
          archetypeId: alternatingSetsArchetypeId,
          archetypeParams: ALTERNATING_SETS_PARAMS([5]),
        },
      });
      const lowOrder = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 100,
          kind: "ATOMIC",
          archetypeId: alternatingSetsArchetypeId,
          archetypeParams: ALTERNATING_SETS_PARAMS([1]),
        },
      });
      const midOrder = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 500,
          kind: "ATOMIC",
          archetypeId: alternatingSetsArchetypeId,
          archetypeParams: ALTERNATING_SETS_PARAMS([3]),
        },
      });

      const expectedOrder = [lowOrder.id, midOrder.id, highOrder.id];

      try {
        const created = await lmsAlternatingGroupApi.create(coach.user.id, activePlanId, {
          relationKind: "ALTERNATING_SETS",
          schemaIds: [highOrder.id, lowOrder.id, midOrder.id],
        });

        expect(created.schemaIds).toEqual(expectedOrder);

        const trailingMember = await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            order: 1500,
            kind: "ATOMIC",
            archetypeId: alternatingSetsArchetypeId,
            archetypeParams: ALTERNATING_SETS_PARAMS([7]),
          },
        });

        const reread = await lmsAlternatingGroupApi.addMember(
          coach.user.id,
          created.id,
          trailingMember.id,
        );

        expect(reread.schemaIds).toEqual([...expectedOrder, trailingMember.id]);
      } finally {
        await ctx.cleanup();
      }
    });
  });
});
