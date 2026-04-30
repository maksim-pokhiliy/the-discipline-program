import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import {
  buildApplyFixture,
  makeWeekPayload,
} from "../../services/lms/apply-template/apply-template.fixtures";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { lmsWeekTemplateApi } from "./week-template";

describe("lmsWeekTemplateApi.create with ownerId (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let fixture: Awaited<ReturnType<typeof buildApplyFixture>>;

  const toCleanup: { table: string; id: string }[] = [];

  const baseInput = (name: string) => ({
    scope: "COACH" as const,
    name,
    payload: makeWeekPayload(fixture.blockKindId, fixture.exerciseId),
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
      lmsWeekTemplateApi.create(
        admin.id,
        baseInput(`WT AdminNoOwner ${crypto.randomUUID().slice(0, 8)}`),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("admin creating COACH-scope with valid coach ownerId succeeds", async () => {
    const created = await lmsWeekTemplateApi.create(admin.id, {
      ...baseInput(`WT AdminCoachOwner ${crypto.randomUUID().slice(0, 8)}`),
      ownerId: fixture.coachUserId,
    });

    toCleanup.push({ table: "weekTemplate", id: created.id });

    expect(created.scope).toBe("COACH");
    expect(created.ownerId).toBe(fixture.coachUserId);
  });

  it("admin creating COACH-scope with non-existent ownerId rejects with 404", async () => {
    await expect(
      lmsWeekTemplateApi.create(admin.id, {
        ...baseInput(`WT AdminMissingOwner ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: "ckmissingxxxxxxxxxxxxxxx5",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("admin creating COACH-scope with athlete ownerId rejects with 400 (not coach-like)", async () => {
    await expect(
      lmsWeekTemplateApi.create(admin.id, {
        ...baseInput(`WT AdminAthleteOwner ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: athlete.id,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("coach passing ownerId in create payload rejects with 403", async () => {
    await expect(
      lmsWeekTemplateApi.create(fixture.coachUserId, {
        ...baseInput(`WT CoachWithOwnerPayload ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: fixture.coachUserId,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("admin creating SYSTEM-scope ignores supplied ownerId and stores null", async () => {
    const created = await lmsWeekTemplateApi.create(admin.id, {
      ...baseInput(`WT AdminSystemIgnoreOwner ${crypto.randomUUID().slice(0, 8)}`),
      scope: "SYSTEM",
      ownerId: fixture.coachUserId,
    });

    toCleanup.push({ table: "weekTemplate", id: created.id });

    expect(created.scope).toBe("SYSTEM");
    expect(created.ownerId).toBeNull();
  });

  it("coach creating SYSTEM-scope rejects with 403", async () => {
    await expect(
      lmsWeekTemplateApi.create(fixture.coachUserId, {
        ...baseInput(`WT CoachSystem ${crypto.randomUUID().slice(0, 8)}`),
        scope: "SYSTEM",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
