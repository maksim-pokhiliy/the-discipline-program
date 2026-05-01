import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  buildApplyFixture,
  makeBlockPayload,
} from "../../../services/lms/apply-template/apply-template.fixtures";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { lmsBlockTemplateApi } from "./block-template";

describe("lmsBlockTemplateApi.create with ownerId (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let fixture: Awaited<ReturnType<typeof buildApplyFixture>>;

  const toCleanup: { table: string; id: string }[] = [];

  const baseInput = (name: string) => ({
    scope: "COACH" as const,
    name,
    payload: makeBlockPayload(fixture.blockKindId, fixture.exerciseId),
  });

  beforeAll(async () => {
    fixture = await buildApplyFixture();
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanup(...fixture.toCleanup);
    await cleanupRaw.user.delete({ where: { id: admin.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  it("admin creating COACH-scope without ownerId rejects with 400", async () => {
    await expect(
      lmsBlockTemplateApi.create(
        admin.id,
        baseInput(`BT AdminNoOwner ${crypto.randomUUID().slice(0, 8)}`),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("admin creating COACH-scope with valid coach ownerId succeeds", async () => {
    const created = await lmsBlockTemplateApi.create(admin.id, {
      ...baseInput(`BT AdminCoachOwner ${crypto.randomUUID().slice(0, 8)}`),
      ownerId: fixture.coachUserId,
    });

    toCleanup.push({ table: "blockTemplate", id: created.id });

    expect(created.scope).toBe("COACH");
    expect(created.ownerId).toBe(fixture.coachUserId);
  });

  it("admin creating COACH-scope with non-existent ownerId rejects with 404", async () => {
    await expect(
      lmsBlockTemplateApi.create(admin.id, {
        ...baseInput(`BT AdminMissingOwner ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: "ckmissingxxxxxxxxxxxxxxx5",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("admin creating COACH-scope with athlete ownerId rejects with 400 (not coach-like)", async () => {
    await expect(
      lmsBlockTemplateApi.create(admin.id, {
        ...baseInput(`BT AdminAthleteOwner ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: athlete.id,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("coach passing ownerId in create payload rejects with 403", async () => {
    await expect(
      lmsBlockTemplateApi.create(fixture.coachUserId, {
        ...baseInput(`BT CoachWithOwnerPayload ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: fixture.coachUserId,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("admin creating SYSTEM-scope ignores supplied ownerId and stores null", async () => {
    const created = await lmsBlockTemplateApi.create(admin.id, {
      ...baseInput(`BT AdminSystemIgnoreOwner ${crypto.randomUUID().slice(0, 8)}`),
      scope: "SYSTEM",
      ownerId: fixture.coachUserId,
    });

    toCleanup.push({ table: "blockTemplate", id: created.id });

    expect(created.scope).toBe("SYSTEM");
    expect(created.ownerId).toBeNull();
  });

  it("coach creating COACH-scope without ownerId stores ownerId = self.id", async () => {
    const created = await lmsBlockTemplateApi.create(
      fixture.coachUserId,
      baseInput(`BT CoachSelf ${crypto.randomUUID().slice(0, 8)}`),
    );

    toCleanup.push({ table: "blockTemplate", id: created.id });

    expect(created.scope).toBe("COACH");
    expect(created.ownerId).toBe(fixture.coachUserId);
  });

  it("coach creating SYSTEM-scope rejects with 403", async () => {
    await expect(
      lmsBlockTemplateApi.create(fixture.coachUserId, {
        ...baseInput(`BT CoachSystem ${crypto.randomUUID().slice(0, 8)}`),
        scope: "SYSTEM",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
