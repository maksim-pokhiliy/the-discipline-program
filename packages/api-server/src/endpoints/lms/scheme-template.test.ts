import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { lmsSchemeTemplateApi } from "./scheme-template";

const COUNT_DOWN_PARAMS = {
  kind: "COUNT_DOWN",
  durationSec: 600,
} as Prisma.InputJsonValue;

describe("lmsSchemeTemplateApi promote/demote (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachA = await createTestCoach();
    coachB = await createTestCoach();
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coachB.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachB.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: admin.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  it("promote happy path", async () => {
    const created = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Tpl PromoteHappy ${crypto.randomUUID().slice(0, 8)}`,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: created.id });

    const promoted = await lmsSchemeTemplateApi.promote(admin.id, created.id);

    expect(promoted.scope).toBe("SYSTEM");
    expect(promoted.ownerId).toBeNull();
  });

  it("promote rejects already-SYSTEM with 409", async () => {
    const created = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "SYSTEM",
        name: `Tpl AlreadySystem ${crypto.randomUUID().slice(0, 8)}`,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: created.id });

    await expect(lmsSchemeTemplateApi.promote(admin.id, created.id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("promote rejects on SYSTEM-name collision with 400", async () => {
    const sharedName = `Tpl Collision ${crypto.randomUUID().slice(0, 8)}`;

    const sys = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "SYSTEM",
        name: sharedName,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: sys.id });

    const coachOwn = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: sharedName,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: coachOwn.id });

    await expect(lmsSchemeTemplateApi.promote(admin.id, coachOwn.id)).rejects.toMatchObject({
      statusCode: 400,
      details: { existingId: sys.id, candidateName: sharedName },
    });
  });

  it("promote rejects non-admin/non-head-coach with 403", async () => {
    const created = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Tpl Forbidden ${crypto.randomUUID().slice(0, 8)}`,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: created.id });

    await expect(lmsSchemeTemplateApi.promote(athlete.id, created.id)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("demote happy path", async () => {
    const created = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "SYSTEM",
        name: `Tpl DemoteHappy ${crypto.randomUUID().slice(0, 8)}`,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: created.id });

    const demoted = await lmsSchemeTemplateApi.demote(admin.id, created.id, {
      newOwnerId: coachA.user.id,
    });

    expect(demoted.scope).toBe("COACH");
    expect(demoted.ownerId).toBe(coachA.user.id);
  });

  it("demote rejects already-COACH with 409", async () => {
    const created = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Tpl AlreadyCoach ${crypto.randomUUID().slice(0, 8)}`,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: created.id });

    await expect(
      lmsSchemeTemplateApi.demote(admin.id, created.id, { newOwnerId: coachB.user.id }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("demote rejects non-coach newOwnerId with 400", async () => {
    const created = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "SYSTEM",
        name: `Tpl WrongOwner ${crypto.randomUUID().slice(0, 8)}`,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: created.id });

    await expect(
      lmsSchemeTemplateApi.demote(admin.id, created.id, { newOwnerId: athlete.id }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("demote rejects on COACH-(owner,name) collision with 400", async () => {
    const sharedName = `Tpl DemoteCollision ${crypto.randomUUID().slice(0, 8)}`;

    const sys = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "SYSTEM",
        name: sharedName,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: sys.id });

    const coachOwn = await cleanupRaw.schemeTemplate.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: sharedName,
        archetypeKind: "COUNT_DOWN",
        defaultParams: COUNT_DOWN_PARAMS,
      },
    });

    toCleanup.push({ table: "schemeTemplate", id: coachOwn.id });

    await expect(
      lmsSchemeTemplateApi.demote(admin.id, sys.id, { newOwnerId: coachA.user.id }),
    ).rejects.toMatchObject({
      statusCode: 400,
      details: { existingId: coachOwn.id, candidateName: sharedName },
    });
  });

  describe("soft-delete extension coverage", () => {
    it("getById returns 404 for soft-deleted scheme template", async () => {
      const created = await cleanupRaw.schemeTemplate.create({
        data: {
          scope: "COACH",
          ownerId: coachA.user.id,
          name: `Tpl SoftDeleted ${crypto.randomUUID().slice(0, 8)}`,
          archetypeKind: "COUNT_DOWN",
          defaultParams: COUNT_DOWN_PARAMS,
          deletedAt: new Date(),
        },
      });

      toCleanup.push({ table: "schemeTemplate", id: created.id });

      await expect(lmsSchemeTemplateApi.getById(admin.id, created.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("promote rejects soft-deleted scheme template with 404", async () => {
      const created = await cleanupRaw.schemeTemplate.create({
        data: {
          scope: "COACH",
          ownerId: coachA.user.id,
          name: `Tpl PromoteSoftDel ${crypto.randomUUID().slice(0, 8)}`,
          archetypeKind: "COUNT_DOWN",
          defaultParams: COUNT_DOWN_PARAMS,
          deletedAt: new Date(),
        },
      });

      toCleanup.push({ table: "schemeTemplate", id: created.id });

      await expect(lmsSchemeTemplateApi.promote(admin.id, created.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("demote rejects soft-deleted scheme template with 404", async () => {
      const created = await cleanupRaw.schemeTemplate.create({
        data: {
          scope: "SYSTEM",
          name: `Tpl DemoteSoftDel ${crypto.randomUUID().slice(0, 8)}`,
          archetypeKind: "COUNT_DOWN",
          defaultParams: COUNT_DOWN_PARAMS,
          deletedAt: new Date(),
        },
      });

      toCleanup.push({ table: "schemeTemplate", id: created.id });

      await expect(
        lmsSchemeTemplateApi.demote(admin.id, created.id, { newOwnerId: coachA.user.id }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("list excludes soft-deleted rows by default", async () => {
      const live = await cleanupRaw.schemeTemplate.create({
        data: {
          scope: "COACH",
          ownerId: coachA.user.id,
          name: `Tpl ListLive ${crypto.randomUUID().slice(0, 8)}`,
          archetypeKind: "COUNT_DOWN",
          defaultParams: COUNT_DOWN_PARAMS,
        },
      });

      toCleanup.push({ table: "schemeTemplate", id: live.id });

      const deleted = await cleanupRaw.schemeTemplate.create({
        data: {
          scope: "COACH",
          ownerId: coachA.user.id,
          name: `Tpl ListSoftDel ${crypto.randomUUID().slice(0, 8)}`,
          archetypeKind: "COUNT_DOWN",
          defaultParams: COUNT_DOWN_PARAMS,
          deletedAt: new Date(),
        },
      });

      toCleanup.push({ table: "schemeTemplate", id: deleted.id });

      const result = await lmsSchemeTemplateApi.list(coachA.user.id, { ownerId: coachA.user.id });
      const ids = result.items.map((item) => item.id);

      expect(ids).toContain(live.id);
      expect(ids).not.toContain(deleted.id);
    });
  });
});
