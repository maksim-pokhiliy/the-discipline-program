import { afterEach, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type CreateExerciseData, getExercisesResponseSchema } from "@repo/contracts/lms/exercise";
import { ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { cmsExerciseAdminApi } from "./admin";
import { lmsExercisePlatformApi } from "./platform";

const EXERCISE_FIELDS = [
  "id",
  "canonicalName",
  "canonicalNameLower",
  "primaryEquipment",
  "movementTypeTagPrimary",
  "movementTypeTagSecondary",
  "canonicalCompoundType",
  "placeholderFlag",
  "movementFamily",
  "defaultDemoUrls",
  "aliases",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

const baseExerciseData = (overrides: Partial<CreateExerciseData> = {}): CreateExerciseData => ({
  canonicalName: `Platform Test ${crypto.randomUUID().slice(0, 8)}`,
  primaryEquipment: "BARBELL",
  movementTypeTagPrimary: "SQUAT",
  movementTypeTagSecondary: null,
  canonicalCompoundType: "ATOMIC",
  placeholderFlag: false,
  movementFamily: null,
  defaultDemoUrls: [],
  aliases: [],
  notes: null,
  ...overrides,
});

describe("lmsExercisePlatformApi.list", () => {
  const createdUserIds: string[] = [];
  const createdCoachProfileIds: string[] = [];
  const createdExerciseIds: string[] = [];

  afterEach(async () => {
    for (const id of createdExerciseIds.splice(0).reverse()) {
      await cleanupRaw.exercise.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdCoachProfileIds.splice(0).reverse()) {
      await cleanupRaw.coachProfile.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdUserIds.splice(0).reverse()) {
      await cleanupRaw.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("rejects a non-coach (athlete) caller with ForbiddenError", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    await expect(lmsExercisePlatformApi.list(athlete.id)).rejects.toThrow(ForbiddenError);
    await expect(lmsExercisePlatformApi.list(athlete.id)).rejects.toMatchObject({
      message: "Coach role required",
    });
  });

  it("authorizes a HEAD_COACH caller", async () => {
    const preexisting = await cleanupRaw.user.findMany({
      where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
      select: { id: true },
    });

    for (const hc of preexisting) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
    }

    const headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    createdUserIds.push(headCoach.id);

    const rows = await lmsExercisePlatformApi.list(headCoach.id);

    expect(Array.isArray(rows)).toBe(true);
  });

  it("authorizes an ADMIN caller", async () => {
    const admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

    createdUserIds.push(admin.id);

    const rows = await lmsExercisePlatformApi.list(admin.id);

    expect(Array.isArray(rows)).toBe(true);
  });

  it("authorizes a COACH caller and returns every exercise with the full Exercise shape", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await cmsExerciseAdminApi.createExercise(
      baseExerciseData({
        canonicalName: `Platform Shape ${crypto.randomUUID().slice(0, 6)}`,
        movementFamily: "platform-shape-family",
        defaultDemoUrls: ["https://example.com/demo"],
        aliases: ["alias-a"],
        notes: "shape probe",
      }),
    );

    createdExerciseIds.push(seeded.id);

    const rows = await lmsExercisePlatformApi.list(coach.user.id);

    expect(rows.length).toBeGreaterThan(0);
    expect(getExercisesResponseSchema.safeParse(rows).success).toBe(true);

    const found = rows.find((row) => row.id === seeded.id);

    expect(found).toBeDefined();

    if (found === undefined) {
      return;
    }

    for (const field of EXERCISE_FIELDS) {
      expect(found).toHaveProperty(field);
    }

    expect(typeof found.id).toBe("string");
    expect(typeof found.canonicalName).toBe("string");
    expect(typeof found.canonicalNameLower).toBe("string");
    expect(typeof found.primaryEquipment).toBe("string");
    expect(typeof found.movementTypeTagPrimary).toBe("string");
    expect(typeof found.canonicalCompoundType).toBe("string");
    expect(typeof found.placeholderFlag).toBe("boolean");
    expect(Array.isArray(found.defaultDemoUrls)).toBe(true);
    expect(Array.isArray(found.aliases)).toBe(true);
    expect(found.createdAt).toBeInstanceOf(Date);
    expect(found.updatedAt).toBeInstanceOf(Date);
  });

  it("returns exercises grouped contiguously by movementFamily and canonicalName-sorted within each family", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const familyA = `family-a-${crypto.randomUUID().slice(0, 6)}`;
    const familyB = `family-b-${crypto.randomUUID().slice(0, 6)}`;

    const seeds: { family: string; name: string }[] = [
      { family: familyB, name: `B-Charlie ${crypto.randomUUID().slice(0, 6)}` },
      { family: familyA, name: `A-Alpha ${crypto.randomUUID().slice(0, 6)}` },
      { family: familyB, name: `B-Alpha ${crypto.randomUUID().slice(0, 6)}` },
      { family: familyA, name: `A-Bravo ${crypto.randomUUID().slice(0, 6)}` },
    ];

    for (const seed of seeds) {
      const created = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: seed.name, movementFamily: seed.family }),
      );

      createdExerciseIds.push(created.id);
    }

    const rows = await lmsExercisePlatformApi.list(coach.user.id);
    const seenFamilies = new Set<string>();
    let previousFamily: string | null | undefined;
    let previousName: string | undefined;

    for (const row of rows) {
      if (previousFamily === undefined || previousFamily !== row.movementFamily) {
        if (row.movementFamily !== null) {
          expect(seenFamilies.has(row.movementFamily)).toBe(false);
          seenFamilies.add(row.movementFamily);
        }

        previousFamily = row.movementFamily;
        previousName = row.canonicalName;
        continue;
      }

      if (previousName !== undefined) {
        expect(previousName <= row.canonicalName).toBe(true);
      }

      previousName = row.canonicalName;
    }
  });
});
