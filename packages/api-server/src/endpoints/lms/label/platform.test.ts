import { afterEach, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { lmsLabelPlatformApi } from "./platform";

const seedLabel = async (name: string) =>
  cleanupRaw.label.create({
    data: {
      name,
      nameLower: name.trim().toLowerCase(),
      applicableLevels: ["DAY"],
      notes: null,
    },
  });

describe("lmsLabelPlatformApi.list", () => {
  const createdLabelIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdCoachProfileIds: string[] = [];

  afterEach(async () => {
    if (createdLabelIds.length > 0) {
      await cleanupRaw.label
        .deleteMany({ where: { id: { in: createdLabelIds.splice(0) } } })
        .catch(() => {});
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

    await expect(lmsLabelPlatformApi.list(athlete.id)).rejects.toThrow(ForbiddenError);
    await expect(lmsLabelPlatformApi.list(athlete.id)).rejects.toMatchObject({
      message: "Coach role required",
    });
  });

  it("returns all labels sorted by nameLower asc when no query is supplied", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel("Push"),
      seedLabel("Pull"),
      seedLabel("Active Rest"),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Active Rest", "Pull", "Push"]);
  });

  it("filters by case-insensitive substring on nameLower", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel("Push Day"),
      seedLabel("Push-Pull"),
      seedLabel("Active Rest"),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, "push");
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Push Day", "Push-Pull"]);
  });

  it("lowercases an upper-case query server-side so the filter is case-insensitive", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel("Push Day"),
      seedLabel("Push-Pull"),
      seedLabel("Active Rest"),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, "PUSH");
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Push Day", "Push-Pull"]);
  });

  it("matches a substring that is not a prefix", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([seedLabel("Active Rest"), seedLabel("Push Day")]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, "rest");
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Active Rest"]);
  });

  it("returns an empty array when the query matches nothing", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([seedLabel("Push Day"), seedLabel("Pull")]);

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, "xyz999");

    expect(rows).toEqual([]);
  });

  it("caps the response at 50 rows even when more rows exist", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all(
      Array.from({ length: 60 }, (_, idx) => seedLabel(`label-${String(idx).padStart(2, "0")}`)),
    );
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);

    expect(rows).toHaveLength(50);
    expect(rows.every((row) => seededIds.has(row.id))).toBe(true);
    expect(rows[0]?.name).toBe("label-00");
    expect(rows[49]?.name).toBe("label-49");
  });

  it("parameterizes special LIKE characters without leaking SQL semantics", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([seedLabel("Push Day"), seedLabel("Conditioning Block")]);

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, "50%");

    expect(rows).toEqual([]);
  });

  it("authorizes a HEAD_COACH caller", async () => {
    const headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    createdUserIds.push(headCoach.id);

    const seeded = await seedLabel(`HeadCoach Label ${crypto.randomUUID().slice(0, 6)}`);

    createdLabelIds.push(seeded.id);

    const rows = await lmsLabelPlatformApi.list(headCoach.id);

    expect(rows.some((row) => row.id === seeded.id)).toBe(true);
  });

  it("authorizes an ADMIN caller", async () => {
    const admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

    createdUserIds.push(admin.id);

    const seeded = await seedLabel(`Admin Label ${crypto.randomUUID().slice(0, 6)}`);

    createdLabelIds.push(seeded.id);

    const rows = await lmsLabelPlatformApi.list(admin.id);

    expect(rows.some((row) => row.id === seeded.id)).toBe(true);
  });

  it("sorts mixed alphabetic names in ascending order", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel("Z label"),
      seedLabel("A label"),
      seedLabel("M label"),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["A label", "M label", "Z label"]);
  });
});
