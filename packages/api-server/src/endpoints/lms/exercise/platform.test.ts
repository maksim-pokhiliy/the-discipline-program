import { afterEach, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreateExerciseData,
  type ExerciseNature,
  getAthleteMovementsResponseSchema,
  getExercisesResponseSchema,
} from "@repo/contracts/lms/exercise";
import { ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  cleanupRaw,
  createTestCoach,
  createTestExercise,
  createTestUser,
} from "../../../test/helpers";

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

  it("attaches the existing row when the same name is re-created with leading/trailing whitespace (idempotent attach)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const name = `Box Jump ${crypto.randomUUID().slice(0, 8)}`;
    const first = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: name }),
    );

    createdExerciseIds.push(first.id);

    const second = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: `   ${name}   ` }),
    );

    expect(second.id).toBe(first.id);

    const count = await cleanupRaw.exercise.count({
      where: { canonicalNameLower: name.trim().toLowerCase() },
    });

    expect(count).toBe(1);
  });

  it("attaches the existing row when a non-ASCII-case variant collapses to the same lowercased key (idempotent attach)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const name = `Ärm Säg ${crypto.randomUUID().slice(0, 8)}`;
    const first = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: name }),
    );

    createdExerciseIds.push(first.id);

    const second = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: name.toLowerCase() }),
    );

    expect(second.id).toBe(first.id);

    const count = await cleanupRaw.exercise.count({
      where: { canonicalNameLower: name.toLowerCase() },
    });

    expect(count).toBe(1);
  });

  it("attaches an admin-authored row when a coach creates the same name (shared canonicalNameLower key space)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const name = `Thruster ${crypto.randomUUID().slice(0, 8)}`;
    const adminRow = await cmsExerciseAdminApi.createExercise(
      baseExerciseData({ canonicalName: name }),
    );

    createdExerciseIds.push(adminRow.id);

    const attached = await lmsExercisePlatformApi.create(
      coach.user.id,
      baseExerciseData({ canonicalName: name.toUpperCase() }),
    );

    expect(attached.id).toBe(adminRow.id);

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

describe("lmsExercisePlatformApi.listForAthlete", () => {
  const createdUserIds: string[] = [];
  const createdExerciseIds: string[] = [];

  const mintExercise = async (canonicalName: string, nature: ExerciseNature) => {
    const row = await createTestExercise({
      canonicalName,
      canonicalNameLower: canonicalName.toLowerCase(),
      nature,
    });

    createdExerciseIds.push(row.id);

    return row;
  };

  afterEach(async () => {
    for (const id of createdExerciseIds.splice(0).reverse()) {
      await cleanupRaw.exercise.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdUserIds.splice(0).reverse()) {
      await cleanupRaw.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("allows an athlete caller without a ForbiddenError, unlike list", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    await expect(lmsExercisePlatformApi.list(athlete.id)).rejects.toThrow(ForbiddenError);
    await expect(lmsExercisePlatformApi.listForAthlete(athlete.id)).resolves.toBeInstanceOf(Array);
  });

  it("offers the CONCRETE row while withholding the PLACEHOLDER and REST ones", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    const suffix = crypto.randomUUID().slice(0, 6);
    const concrete = await mintExercise(`Nature Concrete ${suffix}`, "CONCRETE");
    const placeholder = await mintExercise(`Nature Placeholder ${suffix}`, "PLACEHOLDER");
    const rest = await mintExercise(`Nature Rest ${suffix}`, "REST");

    const ids = (await lmsExercisePlatformApi.listForAthlete(athlete.id)).map((row) => row.id);

    expect(ids).toContain(concrete.id);
    expect(ids).not.toContain(placeholder.id);
    expect(ids).not.toContain(rest.id);
  });

  it("returns movements sorted by canonicalName ascending", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    const suffix = crypto.randomUUID().slice(0, 6);
    const prefix = `ZZ Athlete Sort ${suffix}`;

    await mintExercise(`${prefix} Charlie`, "CONCRETE");
    await mintExercise(`${prefix} Alpha`, "CONCRETE");
    await mintExercise(`${prefix} Bravo`, "CONCRETE");

    const rows = await lmsExercisePlatformApi.listForAthlete(athlete.id);
    const ours = rows
      .filter((row) => row.canonicalName.startsWith(prefix))
      .map((row) => row.canonicalName);

    expect(ours).toEqual([`${prefix} Alpha`, `${prefix} Bravo`, `${prefix} Charlie`]);
  });

  it("trims every item to id and canonicalName and satisfies the response schema", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    const suffix = crypto.randomUUID().slice(0, 6);
    const seeded = await createTestExercise({
      canonicalName: `Athlete Shape ${suffix}`,
      canonicalNameLower: `athlete shape ${suffix}`,
      nature: "CONCRETE",
      aliases: ["shape-alias"],
      notes: "coach-only free text",
    });

    createdExerciseIds.push(seeded.id);

    const rows = await lmsExercisePlatformApi.listForAthlete(athlete.id);

    expect(rows.length).toBeGreaterThan(0);
    expect(getAthleteMovementsResponseSchema.safeParse(rows).success).toBe(true);

    const found = rows.find((row) => row.id === seeded.id);

    expect(found).toBeDefined();

    if (found === undefined) {
      return;
    }

    expect(Object.keys(found).sort()).toEqual(["canonicalName", "id"]);
    expect(found.canonicalName).toBe(`Athlete Shape ${suffix}`);
  });
});
