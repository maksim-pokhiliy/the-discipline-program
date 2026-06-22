import { afterEach, describe, expect, it } from "vitest";

import {
  createProfileAxisSchema,
  type CreateProfileAxisData,
} from "@repo/contracts/coaching/profile-axis";
import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../test/helpers";

import { profileAxisAdminApi } from "./profile-axis";

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
});
