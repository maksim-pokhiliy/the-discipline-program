import { afterEach, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { lmsArchetypePlatformApi } from "./platform";

const SEEDED_ARCHETYPE_COUNT = 34;

const ARCHETYPE_FIELDS = [
  "id",
  "name",
  "kind",
  "family",
  "headerPatternDescription",
  "bodyLayoutDescription",
  "archetypeParamsSchema",
  "relatedArchetypes",
  "createdAt",
  "updatedAt",
] as const;

describe("lmsArchetypePlatformApi.list", () => {
  const createdUserIds: string[] = [];
  const createdCoachProfileIds: string[] = [];

  afterEach(async () => {
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

    await expect(lmsArchetypePlatformApi.list(athlete.id)).rejects.toThrow(ForbiddenError);
    await expect(lmsArchetypePlatformApi.list(athlete.id)).rejects.toMatchObject({
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

    const rows = await lmsArchetypePlatformApi.list(headCoach.id);

    expect(rows.length).toBeGreaterThanOrEqual(SEEDED_ARCHETYPE_COUNT);
  });

  it("authorizes an ADMIN caller", async () => {
    const admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

    createdUserIds.push(admin.id);

    const rows = await lmsArchetypePlatformApi.list(admin.id);

    expect(rows.length).toBeGreaterThanOrEqual(SEEDED_ARCHETYPE_COUNT);
  });

  it("returns at least all 34 seeded archetypes", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const rows = await lmsArchetypePlatformApi.list(coach.user.id);

    expect(rows.length).toBeGreaterThanOrEqual(SEEDED_ARCHETYPE_COUNT);
  });

  it("returns each archetype with the full Archetype shape", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const rows = await lmsArchetypePlatformApi.list(coach.user.id);

    for (const row of rows) {
      for (const field of ARCHETYPE_FIELDS) {
        expect(row).toHaveProperty(field);
      }

      expect(typeof row.id).toBe("string");
      expect(typeof row.name).toBe("string");
      expect(typeof row.kind).toBe("string");
      expect(typeof row.family).toBe("string");
      expect(typeof row.headerPatternDescription).toBe("string");
      expect(typeof row.bodyLayoutDescription).toBe("string");
      expect(row.createdAt).toBeInstanceOf(Date);
      expect(row.updatedAt).toBeInstanceOf(Date);
    }
  });

  it("returns archetypes ordered by family then name", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const rows = await lmsArchetypePlatformApi.list(coach.user.id);

    for (let index = 1; index < rows.length; index++) {
      const previous = rows[index - 1];
      const current = rows[index];

      if (previous === undefined || current === undefined) {
        continue;
      }

      expect(previous.family <= current.family).toBe(true);

      if (previous.family === current.family) {
        expect(previous.name <= current.name).toBe(true);
      }
    }
  });
});
