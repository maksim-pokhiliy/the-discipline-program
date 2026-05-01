import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateBlockKindInput } from "@repo/contracts/lms/block-kind";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { lmsBlockKindApi } from "./block-kind";

describe("lmsBlockKindApi promote/demote (integration)", () => {
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

  it("promote happy path: COACH → SYSTEM with ownerId nulled", async () => {
    const created = await cleanupRaw.blockKind.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Kind PromoteHappy ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: created.id });

    const promoted = await lmsBlockKindApi.promote(admin.id, created.id);

    expect(promoted.scope).toBe("SYSTEM");
    expect(promoted.ownerId).toBeNull();
  });

  it("promote rejects already-SYSTEM with 409", async () => {
    const created = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `Kind PromoteAlreadySystem ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: created.id });

    await expect(lmsBlockKindApi.promote(admin.id, created.id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("promote rejects on SYSTEM-name collision with 400", async () => {
    const sharedName = `Kind Collision ${crypto.randomUUID().slice(0, 8)}`;

    const sys = await cleanupRaw.blockKind.create({
      data: { scope: "SYSTEM", name: sharedName, defaultWeight: 1 },
    });

    toCleanup.push({ table: "blockKind", id: sys.id });

    const coachOwn = await cleanupRaw.blockKind.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: sharedName,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: coachOwn.id });

    await expect(lmsBlockKindApi.promote(admin.id, coachOwn.id)).rejects.toMatchObject({
      statusCode: 400,
      details: { existingId: sys.id, candidateName: sharedName },
    });
  });

  it("promote rejects non-admin/non-head-coach with 403", async () => {
    const created = await cleanupRaw.blockKind.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Kind Forbidden ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: created.id });

    await expect(lmsBlockKindApi.promote(athlete.id, created.id)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("demote happy path: SYSTEM → COACH with newOwnerId", async () => {
    const created = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `Kind DemoteHappy ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: created.id });

    const demoted = await lmsBlockKindApi.demote(admin.id, created.id, {
      newOwnerId: coachA.user.id,
    });

    expect(demoted.scope).toBe("COACH");
    expect(demoted.ownerId).toBe(coachA.user.id);
  });

  it("demote rejects already-COACH with 409", async () => {
    const created = await cleanupRaw.blockKind.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Kind DemoteAlreadyCoach ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: created.id });

    await expect(
      lmsBlockKindApi.demote(admin.id, created.id, { newOwnerId: coachB.user.id }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("demote rejects non-coach newOwnerId with 400", async () => {
    const created = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `Kind DemoteWrongOwner ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: created.id });

    await expect(
      lmsBlockKindApi.demote(admin.id, created.id, { newOwnerId: athlete.id }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("demote rejects on COACH-(owner,name) collision with 400", async () => {
    const sharedName = `Kind DemoteCollision ${crypto.randomUUID().slice(0, 8)}`;

    const sys = await cleanupRaw.blockKind.create({
      data: { scope: "SYSTEM", name: sharedName, defaultWeight: 1 },
    });

    toCleanup.push({ table: "blockKind", id: sys.id });

    const coachOwn = await cleanupRaw.blockKind.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: sharedName,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: coachOwn.id });

    await expect(
      lmsBlockKindApi.demote(admin.id, sys.id, { newOwnerId: coachA.user.id }),
    ).rejects.toMatchObject({
      statusCode: 400,
      details: { existingId: coachOwn.id, candidateName: sharedName },
    });
  });
});

describe("lmsBlockKindApi update scope guard (integration)", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coachA = await createTestCoach();
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
  });

  it("update rejects scope in payload with 403 and leaves DB row unchanged", async () => {
    const item = await cleanupRaw.blockKind.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Kind ScopeGuard ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: item.id });

    const payloadWithScope = {
      scope: "SYSTEM",
    } as unknown as UpdateBlockKindInput;

    await expect(
      lmsBlockKindApi.update(coachA.user.id, item.id, payloadWithScope),
    ).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await cleanupRaw.blockKind.findUnique({ where: { id: item.id } });

    expect(unchanged?.scope).toBe("COACH");
  });
});
