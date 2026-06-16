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
  "nature",
  "defaultDemoUrls",
  "aliases",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

const baseExerciseData = (overrides: Partial<CreateExerciseData> = {}): CreateExerciseData => ({
  canonicalName: `Platform Test ${crypto.randomUUID().slice(0, 8)}`,
  nature: "CONCRETE",
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
    expect(typeof found.nature).toBe("string");
    expect(Array.isArray(found.defaultDemoUrls)).toBe(true);
    expect(Array.isArray(found.aliases)).toBe(true);
    expect(found.createdAt).toBeInstanceOf(Date);
    expect(found.updatedAt).toBeInstanceOf(Date);
  });

  it("returns exercises sorted by canonicalName ascending", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const suffix = crypto.randomUUID().slice(0, 6);
    const names = [
      `ZZ Sort ${suffix} Charlie`,
      `ZZ Sort ${suffix} Alpha`,
      `ZZ Sort ${suffix} Bravo`,
    ];

    for (const name of names) {
      const created = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: name }),
      );

      createdExerciseIds.push(created.id);
    }

    const rows = await lmsExercisePlatformApi.list(coach.user.id);
    const ours = rows
      .filter((row) => row.canonicalName.startsWith(`ZZ Sort ${suffix}`))
      .map((row) => row.canonicalName);

    expect(ours).toEqual([
      `ZZ Sort ${suffix} Alpha`,
      `ZZ Sort ${suffix} Bravo`,
      `ZZ Sort ${suffix} Charlie`,
    ]);
  });
});

describe("lmsExercisePlatformApi.create", () => {
  const createdUserIds: string[] = [];
  const createdCoachProfileIds: string[] = [];
  const createdExerciseIds: string[] = [];

  afterEach(async () => {
    if (createdExerciseIds.length > 0) {
      await cleanupRaw.exercise
        .deleteMany({ where: { id: { in: createdExerciseIds.splice(0) } } })
        .catch(() => {});
    }

    for (const id of createdCoachProfileIds.splice(0).reverse()) {
      await cleanupRaw.coachProfile.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdUserIds.splice(0).reverse()) {
      await cleanupRaw.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("lets a coach mint an exercise and returns the DTO matching the input", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const data = baseExerciseData({
      canonicalName: `Sled Push ${crypto.randomUUID().slice(0, 8)}`,
      defaultDemoUrls: ["https://example.com/sled"],
      aliases: ["Prowler Push"],
      notes: "Drive through the legs.",
    });

    const created = await lmsExercisePlatformApi.create(coach.user.id, data);

    createdExerciseIds.push(created.id);

    expect(created.canonicalName).toBe(data.canonicalName);
    expect(created.canonicalNameLower).toBe(data.canonicalName.toLowerCase());
    expect(created.nature).toBe("CONCRETE");
    expect(created.defaultDemoUrls).toEqual(["https://example.com/sled"]);
    expect(created.aliases).toEqual(["Prowler Push"]);
    expect(created.notes).toBe("Drive through the legs.");
    expect(created).not.toHaveProperty("movementFamily");

    const stored = await cleanupRaw.exercise.findUnique({ where: { id: created.id } });

    expect(stored?.canonicalNameLower).toBe(data.canonicalName.toLowerCase());
  });

  it("attaches the existing row when the same canonicalName is created again (idempotent attach, no conflict)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const name = `Wall Ball ${crypto.randomUUID().slice(0, 8)}`;
    const first = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: name }),
    );

    createdExerciseIds.push(first.id);

    const second = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: name.toUpperCase() }),
    );

    expect(second.id).toBe(first.id);

    const count = await cleanupRaw.exercise.count({
      where: { canonicalNameLower: name.toLowerCase() },
    });

    expect(count).toBe(1);
  });

  it("rejects a non-coach (athlete) caller with ForbiddenError", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    await expect(
      lmsExercisePlatformApi.create(
        athlete.id,
        baseExerciseData({ canonicalName: `Denied ${crypto.randomUUID().slice(0, 8)}` }),
      ),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      lmsExercisePlatformApi.create(
        athlete.id,
        baseExerciseData({ canonicalName: `Denied ${crypto.randomUUID().slice(0, 8)}` }),
      ),
    ).rejects.toMatchObject({ message: "Coach role required" });
  });
});
