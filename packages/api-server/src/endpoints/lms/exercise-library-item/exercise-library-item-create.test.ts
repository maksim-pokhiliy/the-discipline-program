import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { lmsExerciseLibraryItemApi } from "./exercise-library-item";

describe("lmsExerciseLibraryItemApi create with ownerId (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  const baseInput = (name: string) => ({
    scope: "COACH" as const,
    name,
    nameAliases: [],
    primaryMovement: "SQUAT" as const,
    modality: "BARBELL" as const,
    equipment: [],
    primaryBodyParts: [],
    secondaryBodyParts: [],
    skillLevel: "BEGINNER" as const,
    defaultMetrics: {
      canMeasureLoad: true,
      canMeasureReps: true,
      canMeasureDuration: false,
      canMeasureDistance: false,
      canMeasureCalories: false,
    },
    isBenchmark: false,
  });

  beforeAll(async () => {
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachA = await createTestCoach();
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: admin.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  it("admin creating COACH-scope without ownerId rejects with 400", async () => {
    await expect(
      lmsExerciseLibraryItemApi.create(
        admin.id,
        baseInput(`Ex AdminNoOwner ${crypto.randomUUID().slice(0, 8)}`),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("admin creating COACH-scope with valid coach ownerId succeeds", async () => {
    const created = await lmsExerciseLibraryItemApi.create(admin.id, {
      ...baseInput(`Ex AdminCoachOwner ${crypto.randomUUID().slice(0, 8)}`),
      ownerId: coachA.user.id,
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    expect(created.scope).toBe("COACH");
    expect(created.ownerId).toBe(coachA.user.id);
  });

  it("admin creating COACH-scope with non-existent ownerId rejects with 404", async () => {
    await expect(
      lmsExerciseLibraryItemApi.create(admin.id, {
        ...baseInput(`Ex AdminMissingOwner ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: "ckmissingxxxxxxxxxxxxxxx5",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("admin creating COACH-scope with athlete ownerId rejects with 400 (not coach-like)", async () => {
    await expect(
      lmsExerciseLibraryItemApi.create(admin.id, {
        ...baseInput(`Ex AdminAthleteOwner ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: athlete.id,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("coach passing ownerId in create payload rejects with 403", async () => {
    await expect(
      lmsExerciseLibraryItemApi.create(coachA.user.id, {
        ...baseInput(`Ex CoachWithOwnerPayload ${crypto.randomUUID().slice(0, 8)}`),
        ownerId: coachA.user.id,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("admin creating SYSTEM-scope ignores supplied ownerId and stores null", async () => {
    const created = await lmsExerciseLibraryItemApi.create(admin.id, {
      ...baseInput(`Ex AdminSystemIgnoreOwner ${crypto.randomUUID().slice(0, 8)}`),
      scope: "SYSTEM",
      ownerId: coachA.user.id,
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    expect(created.scope).toBe("SYSTEM");
    expect(created.ownerId).toBeNull();
  });
});
