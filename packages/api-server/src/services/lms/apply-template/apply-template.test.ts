import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { applyBlockTemplate } from "./apply-block-template";
import { applySessionTemplate } from "./apply-session-template";
import {
  buildApplyFixture,
  makeBlockPayload,
  makeSessionPayload,
  makeWeekPayload,
} from "./apply-template.fixtures";
import { applyWeekTemplate } from "./apply-week-template";

const toJson = (v: unknown) => v as Prisma.InputJsonValue;

describe("applyBlockTemplate (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let fixture: Awaited<ReturnType<typeof buildApplyFixture>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    fixture = await buildApplyFixture();
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanup(...fixture.toCleanup);
    await cleanupRaw.user.delete({ where: { id: admin.id } }).catch(() => {});
  });

  it("happy path: clones block + segment + setGroup + entry into target session", async () => {
    const tpl = await cleanupRaw.blockTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `BT Apply Happy ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "blockTemplate", id: tpl.id });

    const result = await applyBlockTemplate(fixture.coachUserId, fixture.planId, {
      kind: "block",
      templateId: tpl.id,
      target: { sessionId: fixture.sessionId, order: 0 },
    });

    expect(result.blockId).toBeDefined();

    const block = await cleanupRaw.block.findUnique({
      where: { id: result.blockId },
      select: {
        id: true,
        sessionId: true,
        kindId: true,
        version: true,
        segments: {
          select: {
            id: true,
            archetypeKind: true,
            version: true,
            setGroups: {
              select: {
                id: true,
                entries: { select: { id: true, exerciseId: true, version: true } },
              },
            },
          },
        },
      },
    });

    expect(block).not.toBeNull();
    expect(block?.sessionId).toBe(fixture.sessionId);
    expect(block?.kindId).toBe(fixture.blockKindId);
    expect(block?.version).toBe(1);
    expect(block?.segments.length).toBe(1);

    const seg = block?.segments[0];

    expect(seg?.archetypeKind).toBe("COUNT_DOWN");
    expect(seg?.version).toBe(1);
    expect(seg?.setGroups.length).toBe(1);

    const sg = seg?.setGroups[0];

    expect(sg?.entries.length).toBe(1);
    expect(sg?.entries[0]?.exerciseId).toBe(fixture.exerciseId);
    expect(sg?.entries[0]?.version).toBe(1);
  });

  it("clones with fresh ids — new block id != template payload (no id passthrough)", async () => {
    const tpl = await cleanupRaw.blockTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `BT Fresh Ids ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "blockTemplate", id: tpl.id });

    const r1 = await applyBlockTemplate(fixture.coachUserId, fixture.planId, {
      kind: "block",
      templateId: tpl.id,
      target: { sessionId: fixture.sessionId, order: 1 },
    });

    const r2 = await applyBlockTemplate(fixture.coachUserId, fixture.planId, {
      kind: "block",
      templateId: tpl.id,
      target: { sessionId: fixture.sessionId, order: 2 },
    });

    expect(r1.blockId).not.toBe(r2.blockId);

    const segs1 = await cleanupRaw.blockSegment.findMany({
      where: { blockId: r1.blockId },
      select: { id: true, setGroups: { select: { id: true } } },
    });

    const segs2 = await cleanupRaw.blockSegment.findMany({
      where: { blockId: r2.blockId },
      select: { id: true, setGroups: { select: { id: true } } },
    });

    expect(segs1[0]?.id).not.toBe(segs2[0]?.id);
    expect(segs1[0]?.setGroups[0]?.id).not.toBe(segs2[0]?.setGroups[0]?.id);
  });

  it("rejects when coach tries to apply COACH-template owned by another coach (403)", async () => {
    const tpl = await cleanupRaw.blockTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.otherCoachUserId,
        name: `BT OtherOwner ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "blockTemplate", id: tpl.id });

    await expect(
      applyBlockTemplate(fixture.coachUserId, fixture.planId, {
        kind: "block",
        templateId: tpl.id,
        target: { sessionId: fixture.sessionId, order: 0 },
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("admin can apply COACH-template owned by any coach (privileged path)", async () => {
    const tpl = await cleanupRaw.blockTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.otherCoachUserId,
        name: `BT AdminApply ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "blockTemplate", id: tpl.id });

    const result = await applyBlockTemplate(admin.id, fixture.planId, {
      kind: "block",
      templateId: tpl.id,
      target: { sessionId: fixture.sessionId, order: 3 },
    });

    expect(result.blockId).toBeDefined();
  });

  it("rejects when target session belongs to a different plan (422)", async () => {
    const otherPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: fixture.coachUserId,
        name: `Other plan ${crypto.randomUUID().slice(0, 8)}`,
      },
    });

    toCleanup.push({ table: "trainingPlan", id: otherPlan.id });

    const tpl = await cleanupRaw.blockTemplate.create({
      data: {
        scope: "SYSTEM",
        ownerId: null,
        name: `BT WrongPlan ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "blockTemplate", id: tpl.id });

    await expect(
      applyBlockTemplate(fixture.coachUserId, otherPlan.id, {
        kind: "block",
        templateId: tpl.id,
        target: { sessionId: fixture.sessionId, order: 0 },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects soft-deleted template with 404", async () => {
    const tpl = await cleanupRaw.blockTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `BT Deleted ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        deletedAt: new Date(),
      },
    });

    toCleanup.push({ table: "blockTemplate", id: tpl.id });

    await expect(
      applyBlockTemplate(fixture.coachUserId, fixture.planId, {
        kind: "block",
        templateId: tpl.id,
        target: { sessionId: fixture.sessionId, order: 5 },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("applySessionTemplate (integration)", () => {
  let fixture: Awaited<ReturnType<typeof buildApplyFixture>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    fixture = await buildApplyFixture();
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanup(...fixture.toCleanup);
  });

  it("happy path: creates new session + clones nested blocks", async () => {
    const tpl = await cleanupRaw.sessionTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `ST Apply Happy ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeSessionPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "sessionTemplate", id: tpl.id });

    const result = await applySessionTemplate(fixture.coachUserId, fixture.planId, {
      kind: "session",
      templateId: tpl.id,
      target: { dayId: fixture.dayId, order: 1 },
    });

    expect(result.sessionId).toBeDefined();

    const newSession = await cleanupRaw.lmsSession.findUnique({
      where: { id: result.sessionId },
      select: { dayId: true, order: true, blocks: { select: { id: true } } },
    });

    expect(newSession?.dayId).toBe(fixture.dayId);
    expect(newSession?.order).toBe(1);
    expect(newSession?.blocks.length).toBe(1);
  });

  it("rejects when target day does not belong to this plan (422)", async () => {
    const otherPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: fixture.coachUserId,
        name: `Other plan ST ${crypto.randomUUID().slice(0, 8)}`,
      },
    });

    toCleanup.push({ table: "trainingPlan", id: otherPlan.id });

    const otherWeek = await cleanupRaw.week.create({ data: { planId: otherPlan.id, index: 0 } });
    const otherDay = await cleanupRaw.day.create({
      data: { weekId: otherWeek.id, dayOfWeek: "TUE" },
    });

    const tpl = await cleanupRaw.sessionTemplate.create({
      data: {
        scope: "SYSTEM",
        ownerId: null,
        name: `ST WrongPlan ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeSessionPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "sessionTemplate", id: tpl.id });

    await expect(
      applySessionTemplate(fixture.coachUserId, fixture.planId, {
        kind: "session",
        templateId: tpl.id,
        target: { dayId: otherDay.id, order: 0 },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("applyWeekTemplate (integration)", () => {
  let fixture: Awaited<ReturnType<typeof buildApplyFixture>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    fixture = await buildApplyFixture();
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanup(...fixture.toCleanup);
  });

  it("happy path: creates new week + nested days/sessions/blocks", async () => {
    const tpl = await cleanupRaw.weekTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `WT Apply Happy ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeWeekPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "weekTemplate", id: tpl.id });

    const result = await applyWeekTemplate(fixture.coachUserId, fixture.planId, {
      kind: "week",
      templateId: tpl.id,
      target: { index: 5 },
    });

    expect(result.weekId).toBeDefined();

    const week = await cleanupRaw.week.findUnique({
      where: { id: result.weekId },
      select: {
        index: true,
        days: { select: { dayOfWeek: true, sessions: { select: { blocks: true } } } },
      },
    });

    expect(week?.index).toBe(5);
    expect(week?.days.length).toBe(1);
    expect(week?.days[0]?.sessions.length).toBe(1);
    expect(week?.days[0]?.sessions[0]?.blocks.length).toBe(1);
  });

  it("rejects with 409 when target weekIndex already exists in plan", async () => {
    const tpl = await cleanupRaw.weekTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `WT Conflict ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(makeWeekPayload(fixture.blockKindId, fixture.exerciseId)),
      },
    });

    toCleanup.push({ table: "weekTemplate", id: tpl.id });

    await expect(
      applyWeekTemplate(fixture.coachUserId, fixture.planId, {
        kind: "week",
        templateId: tpl.id,
        target: { index: 0 },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("nested-create: full multi-day/session/block tree applied with shared snapshot map (perf-002)", async () => {
    const baseSessionPayload = makeSessionPayload(fixture.blockKindId, fixture.exerciseId);
    const secondSession = {
      ...baseSessionPayload,
      session: { ...baseSessionPayload.session, order: 1 },
    };
    const richPayload = {
      week: { label: "Rich Week", notes: null },
      days: [
        {
          dayOfWeek: "MON" as const,
          kind: "TRAINING" as const,
          notes: null,
          sessions: [baseSessionPayload, secondSession],
        },
        {
          dayOfWeek: "WED" as const,
          kind: "TRAINING" as const,
          notes: null,
          sessions: [baseSessionPayload],
        },
      ],
    };

    const tpl = await cleanupRaw.weekTemplate.create({
      data: {
        scope: "COACH",
        ownerId: fixture.coachUserId,
        name: `WT Rich ${crypto.randomUUID().slice(0, 8)}`,
        payload: toJson(richPayload),
      },
    });

    toCleanup.push({ table: "weekTemplate", id: tpl.id });

    const result = await applyWeekTemplate(fixture.coachUserId, fixture.planId, {
      kind: "week",
      templateId: tpl.id,
      target: { index: 8 },
    });

    const week = await cleanupRaw.week.findUnique({
      where: { id: result.weekId },
      select: {
        days: {
          select: {
            sessions: {
              select: {
                blocks: {
                  select: {
                    segments: {
                      select: {
                        setGroups: {
                          select: { entries: { select: { exerciseSnapshot: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(week?.days.length).toBe(2);

    const totalSessions = (week?.days ?? []).reduce((sum, d) => sum + d.sessions.length, 0);

    expect(totalSessions).toBe(3);

    const allEntries = (week?.days ?? []).flatMap((d) =>
      d.sessions.flatMap((s) =>
        s.blocks.flatMap((b) =>
          b.segments.flatMap((seg) => seg.setGroups.flatMap((sg) => sg.entries)),
        ),
      ),
    );

    expect(allEntries.length).toBe(3);

    for (const entry of allEntries) {
      const snap = entry.exerciseSnapshot as { id?: string; primaryMovement?: string };

      expect(snap.id).toBe(fixture.exerciseId);
      expect(snap.primaryMovement).toBe("SQUAT");
    }
  });
});
