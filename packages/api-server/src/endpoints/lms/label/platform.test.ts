import { afterEach, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type AppLevelValue } from "@repo/contracts/lms/label";
import { ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { LABEL_SEARCH_CAP, lmsLabelPlatformApi } from "./platform";

const seedLabel = async ({ name, levels = ["DAY"] }: { name: string; levels?: AppLevelValue[] }) =>
  cleanupRaw.label.create({
    data: {
      name,
      nameLower: name.trim().toLowerCase(),
      applicableLevels: levels,
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
      seedLabel({ name: "Push" }),
      seedLabel({ name: "Pull" }),
      seedLabel({ name: "Active Rest" }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Active Rest", "Pull", "Push"]);
  });

  it("returns all labels when an explicit empty query object is supplied (preload parity)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([seedLabel({ name: "Push" }), seedLabel({ name: "Pull" })]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, {});
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name).sort()).toEqual(["Pull", "Push"]);
  });

  it("filters by case-insensitive substring on nameLower", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Push Day" }),
      seedLabel({ name: "Push-Pull" }),
      seedLabel({ name: "Active Rest" }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "push" });
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Push Day", "Push-Pull"]);
  });

  it("lowercases an upper-case query server-side so the filter is case-insensitive", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Push Day" }),
      seedLabel({ name: "Push-Pull" }),
      seedLabel({ name: "Active Rest" }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "PUSH" });
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Push Day", "Push-Pull"]);
  });

  it("matches a substring that is not a prefix", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Active Rest" }),
      seedLabel({ name: "Push Day" }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "rest" });
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Active Rest"]);
  });

  it("returns an empty array when the query matches nothing", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Push Day" }),
      seedLabel({ name: "Pull" }),
    ]);

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "xyz999" });

    expect(rows).toEqual([]);
  });

  it("returns all labels when total is below LABEL_SEARCH_CAP", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all(
      Array.from({ length: 60 }, (_, idx) =>
        seedLabel({ name: `label-${String(idx).padStart(2, "0")}` }),
      ),
    );
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours).toHaveLength(60);
    expect(ours[0]?.name).toBe("label-00");
    expect(ours[59]?.name).toBe("label-59");
  });

  it("applies LABEL_SEARCH_CAP to no-query preload when more rows exist", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all(
      Array.from({ length: LABEL_SEARCH_CAP + 1 }, (_, idx) =>
        seedLabel({ name: `cap-${String(idx).padStart(4, "0")}` }),
      ),
    );

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);

    expect(rows).toHaveLength(LABEL_SEARCH_CAP);
  });

  it("parameterizes special LIKE characters without leaking SQL semantics", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Push Day" }),
      seedLabel({ name: "Conditioning Block" }),
    ]);

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "50%" });

    expect(rows).toEqual([]);
  });

  it("authorizes a HEAD_COACH caller", async () => {
    const headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    createdUserIds.push(headCoach.id);

    const seeded = await seedLabel({ name: `HeadCoach Label ${crypto.randomUUID().slice(0, 6)}` });

    createdLabelIds.push(seeded.id);

    const rows = await lmsLabelPlatformApi.list(headCoach.id);

    expect(rows.some((row) => row.id === seeded.id)).toBe(true);
  });

  it("authorizes an ADMIN caller", async () => {
    const admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

    createdUserIds.push(admin.id);

    const seeded = await seedLabel({ name: `Admin Label ${crypto.randomUUID().slice(0, 6)}` });

    createdLabelIds.push(seeded.id);

    const rows = await lmsLabelPlatformApi.list(admin.id);

    expect(rows.some((row) => row.id === seeded.id)).toBe(true);
  });

  it("sorts mixed alphabetic names in ascending order", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Z label" }),
      seedLabel({ name: "A label" }),
      seedLabel({ name: "M label" }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id);
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["A label", "M label", "Z label"]);
  });

  it("filters by applicableLevels using level parameter (DAY only)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Push Day", levels: ["DAY"] }),
      seedLabel({ name: "Long Session", levels: ["SESSION"] }),
      seedLabel({ name: "EMOM Block", levels: ["BLOCK"] }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { level: "DAY" });
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Push Day"]);
  });

  it("includes labels with multi-level applicability under each matched level", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const multi = await seedLabel({ name: "Multi", levels: ["DAY", "SESSION"] });

    createdLabelIds.push(multi.id);

    const day = await lmsLabelPlatformApi.list(coach.user.id, { level: "DAY" });
    const session = await lmsLabelPlatformApi.list(coach.user.id, { level: "SESSION" });
    const block = await lmsLabelPlatformApi.list(coach.user.id, { level: "BLOCK" });

    expect(day.some((row) => row.id === multi.id)).toBe(true);
    expect(session.some((row) => row.id === multi.id)).toBe(true);
    expect(block.some((row) => row.id === multi.id)).toBe(false);
  });

  it("combines q and level filters with AND semantics", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const seeded = await Promise.all([
      seedLabel({ name: "Push Day", levels: ["DAY"] }),
      seedLabel({ name: "Push Session", levels: ["SESSION"] }),
      seedLabel({ name: "Pull Day", levels: ["DAY"] }),
    ]);
    const seededIds = new Set(seeded.map((row) => row.id));

    createdLabelIds.push(...seeded.map((row) => row.id));

    const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "push", level: "DAY" });
    const ours = rows.filter((row) => seededIds.has(row.id));

    expect(ours.map((row) => row.name)).toEqual(["Push Day"]);
  });
});
