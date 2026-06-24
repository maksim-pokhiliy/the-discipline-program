import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  createProfileAxisSchema,
  type CreateProfileAxisData,
} from "@repo/contracts/coaching/profile-axis";
import { UserRole } from "@repo/contracts/iam/auth";
import { GENDER_AXIS_VALUES } from "@repo/contracts/lms/_shared";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { profileAxisAdminApi, profileAxisPlatformApi } from "./profile-axis";

const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";

const uniqueKey = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const baseAxisData = (overrides: Partial<CreateProfileAxisData> = {}): CreateProfileAxisData => ({
  key: uniqueKey("axis"),
  label: "Level",
  values: ["RX", "SC"],
  ...overrides,
});

const parseInput = (overrides: Partial<CreateProfileAxisData> = {}): CreateProfileAxisData =>
  createProfileAxisSchema.parse(baseAxisData(overrides));

describe("profileAxisAdminApi", () => {
  const createdAxisIds: string[] = [];

  afterEach(async () => {
    for (const id of createdAxisIds.splice(0).reverse()) {
      await cleanupRaw.profileAxis.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("createProfileAxis", () => {
    it("creates an axis and round-trips it via getProfileAxisById", async () => {
      const created = await profileAxisAdminApi.createProfileAxis(
        parseInput({ label: "Workload Level", values: ["RX", "SC", "M-F"] }),
      );

      createdAxisIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.label).toBe("Workload Level");
      expect(created.values).toEqual(["RX", "SC", "M-F"]);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      const fetched = await profileAxisAdminApi.getProfileAxisById(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.key).toBe(created.key);
      expect(fetched.values).toEqual(["RX", "SC", "M-F"]);
    });

    it("rejects a duplicate key with a ConflictError", async () => {
      const key = uniqueKey("dup");
      const first = await profileAxisAdminApi.createProfileAxis(parseInput({ key }));

      createdAxisIds.push(first.id);

      await expect(profileAxisAdminApi.createProfileAxis(parseInput({ key }))).rejects.toThrow(
        ConflictError,
      );

      await expect(
        profileAxisAdminApi.createProfileAxis(parseInput({ key })),
      ).rejects.toMatchObject({ details: { field: "key" } });
    });
  });

  describe("getProfileAxes", () => {
    it("returns rows ordered by createdAt desc", async () => {
      const first = await profileAxisAdminApi.createProfileAxis(parseInput());

      createdAxisIds.push(first.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const second = await profileAxisAdminApi.createProfileAxis(parseInput());

      createdAxisIds.push(second.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const third = await profileAxisAdminApi.createProfileAxis(parseInput());

      createdAxisIds.push(third.id);

      const axes = await profileAxisAdminApi.getProfileAxes();
      const ids = axes.map((row) => row.id);

      expect(ids.indexOf(third.id)).toBeLessThan(ids.indexOf(second.id));
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });
  });

  describe("getProfileAxisById", () => {
    it("throws NotFoundError for a non-existent id", async () => {
      await expect(
        profileAxisAdminApi.getProfileAxisById("cl000000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateProfileAxis", () => {
    it("updates label and values", async () => {
      const created = await profileAxisAdminApi.createProfileAxis(parseInput());

      createdAxisIds.push(created.id);

      const updated = await profileAxisAdminApi.updateProfileAxis(created.id, {
        label: "Renamed Axis",
        values: ["A", "B", "C"],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.label).toBe("Renamed Axis");
      expect(updated.values).toEqual(["A", "B", "C"]);
    });

    it("throws NotFoundError when updating a non-existent id", async () => {
      await expect(
        profileAxisAdminApi.updateProfileAxis("cl000000000000000000000000", { label: "X" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects renaming key onto an existing key with a ConflictError", async () => {
      const axisA = await profileAxisAdminApi.createProfileAxis(
        parseInput({ key: uniqueKey("a") }),
      );

      createdAxisIds.push(axisA.id);

      const axisB = await profileAxisAdminApi.createProfileAxis(
        parseInput({ key: uniqueKey("b") }),
      );

      createdAxisIds.push(axisB.id);

      await expect(
        profileAxisAdminApi.updateProfileAxis(axisB.id, { key: axisA.key }),
      ).rejects.toThrow(ConflictError);

      await expect(
        profileAxisAdminApi.updateProfileAxis(axisB.id, { key: axisA.key }),
      ).rejects.toMatchObject({ details: { field: "key" } });
    });
  });

  describe("deleteProfileAxis", () => {
    it("deletes an axis", async () => {
      const created = await profileAxisAdminApi.createProfileAxis(parseInput());

      await expect(profileAxisAdminApi.deleteProfileAxis(created.id)).resolves.toBeUndefined();

      await expect(profileAxisAdminApi.getProfileAxisById(created.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when deleting a non-existent id", async () => {
      await expect(
        profileAxisAdminApi.deleteProfileAxis("cl000000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getProfileAxesPageData", () => {
    it("returns the axes wrapped in a profileAxes key", async () => {
      const created = await profileAxisAdminApi.createProfileAxis(parseInput());

      createdAxisIds.push(created.id);

      const pageData = await profileAxisAdminApi.getProfileAxesPageData();

      expect(Array.isArray(pageData.profileAxes)).toBe(true);
      expect(pageData.profileAxes.some((axis) => axis.id === created.id)).toBe(true);
    });
  });

  describe("createProfileAxis binding", () => {
    it("never sets a binding on a created axis", async () => {
      const created = await profileAxisAdminApi.createProfileAxis(parseInput());

      createdAxisIds.push(created.id);

      expect(created.binding).toBeNull();

      const fetched = await profileAxisAdminApi.getProfileAxisById(created.id);

      expect(fetched.binding).toBeNull();
    });
  });

  describe("system Gender axis protection", () => {
    it("seeds the system Gender row with the GENDER binding and the canonical values", async () => {
      const system = await profileAxisAdminApi.getProfileAxisById(SYSTEM_GENDER_AXIS_ID);

      expect(system.binding).toBe("GENDER");
      expect(system.values).toEqual(GENDER_AXIS_VALUES);
    });

    it("rejects updating the system Gender axis with a ForbiddenError", async () => {
      await expect(
        profileAxisAdminApi.updateProfileAxis(SYSTEM_GENDER_AXIS_ID, { label: "Sex" }),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        profileAxisAdminApi.updateProfileAxis(SYSTEM_GENDER_AXIS_ID, { label: "Sex" }),
      ).rejects.toMatchObject({ details: { field: "binding" } });
    });

    it("rejects deleting the system Gender axis with a ForbiddenError", async () => {
      await expect(profileAxisAdminApi.deleteProfileAxis(SYSTEM_GENDER_AXIS_ID)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});

describe("profileAxisPlatformApi", () => {
  const createdAxisIds: string[] = [];

  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let coach: Awaited<ReturnType<typeof createTestUser>>;
  let headCoach: Awaited<ReturnType<typeof createTestUser>>;
  let admin: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
    coach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterEach(async () => {
    for (const id of createdAxisIds.splice(0).reverse()) {
      await cleanupRaw.profileAxis.delete({ where: { id } }).catch(() => {});
    }
  });

  afterAll(async () => {
    await cleanup(
      { table: "user", id: athlete.id },
      { table: "user", id: coach.id },
      { table: "user", id: headCoach.id },
      { table: "user", id: admin.id },
    );
  });

  describe("list role-gate (Must-Test 1)", () => {
    it("rejects an athlete caller with a ForbiddenError", async () => {
      await expect(profileAxisPlatformApi.list(athlete.id)).rejects.toThrow(ForbiddenError);
    });

    it("allows a coach caller", async () => {
      await expect(profileAxisPlatformApi.list(coach.id)).resolves.toBeInstanceOf(Array);
    });

    it("allows a head-coach caller", async () => {
      await expect(profileAxisPlatformApi.list(headCoach.id)).resolves.toBeInstanceOf(Array);
    });

    it("allows an admin caller", async () => {
      await expect(profileAxisPlatformApi.list(admin.id)).resolves.toBeInstanceOf(Array);
    });
  });

  describe("create role-gate (Must-Test 1)", () => {
    it("rejects an athlete caller with a ForbiddenError before writing", async () => {
      await expect(profileAxisPlatformApi.create(athlete.id, parseInput())).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("lets a coach create an axis", async () => {
      const created = await profileAxisPlatformApi.create(
        coach.id,
        parseInput({ label: "Coach Axis", values: ["RX", "SC"] }),
      );

      createdAxisIds.push(created.id);

      expect(created.id).toBeDefined();
      expect(created.label).toBe("Coach Axis");
      expect(created.values).toEqual(["RX", "SC"]);
    });

    it("lets a head-coach create an axis", async () => {
      const created = await profileAxisPlatformApi.create(headCoach.id, parseInput());

      createdAxisIds.push(created.id);

      expect(created.id).toBeDefined();
    });

    it("lets an admin create an axis", async () => {
      const created = await profileAxisPlatformApi.create(admin.id, parseInput());

      createdAxisIds.push(created.id);

      expect(created.id).toBeDefined();
    });
  });

  describe("create duplicate key (Must-Test 2)", () => {
    it("rejects a duplicate key with a ConflictError scoped to the key field", async () => {
      const key = uniqueKey("dup-platform");
      const first = await profileAxisPlatformApi.create(coach.id, parseInput({ key }));

      createdAxisIds.push(first.id);

      await expect(profileAxisPlatformApi.create(coach.id, parseInput({ key }))).rejects.toThrow(
        ConflictError,
      );

      await expect(
        profileAxisPlatformApi.create(coach.id, parseInput({ key })),
      ).rejects.toMatchObject({ details: { field: "key" } });
    });

    it("shares one createProfileAxisRow path: an admin-created key conflicts on platform create (DR-2)", async () => {
      const key = uniqueKey("shared-path");
      const adminCreated = await profileAxisAdminApi.createProfileAxis(parseInput({ key }));

      createdAxisIds.push(adminCreated.id);

      await expect(profileAxisPlatformApi.create(coach.id, parseInput({ key }))).rejects.toThrow(
        ConflictError,
      );
    });

    it("shares one createProfileAxisRow path: a platform-created key conflicts on admin create (DR-2)", async () => {
      const key = uniqueKey("shared-path");
      const platformCreated = await profileAxisPlatformApi.create(coach.id, parseInput({ key }));

      createdAxisIds.push(platformCreated.id);

      await expect(profileAxisAdminApi.createProfileAxis(parseInput({ key }))).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("list ordering (Must-Test 3)", () => {
    it("returns axes ordered by label asc, unlike the admin createdAt desc order", async () => {
      const zulu = await profileAxisPlatformApi.create(coach.id, parseInput({ label: "Zulu" }));

      createdAxisIds.push(zulu.id);

      const alpha = await profileAxisPlatformApi.create(coach.id, parseInput({ label: "Alpha" }));

      createdAxisIds.push(alpha.id);

      const mike = await profileAxisPlatformApi.create(coach.id, parseInput({ label: "Mike" }));

      createdAxisIds.push(mike.id);

      const axes = await profileAxisPlatformApi.list(coach.id);
      const ids = axes.map((row) => row.id);

      expect(ids.indexOf(alpha.id)).toBeLessThan(ids.indexOf(mike.id));
      expect(ids.indexOf(mike.id)).toBeLessThan(ids.indexOf(zulu.id));
    });
  });
});
