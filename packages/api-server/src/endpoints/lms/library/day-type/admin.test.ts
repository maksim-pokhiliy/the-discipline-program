import { afterAll, describe, expect, it } from "vitest";

import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanup } from "../../../../test/helpers";

import { lmsDayTypeAdminApi } from "./admin";

const uniqueName = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const baseDayTypeData = (overrides: Record<string, unknown> = {}) => ({
  name: uniqueName("test-day"),
  color: "#1976d2",
  ...overrides,
});

describe("lmsDayTypeAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getDayTypes", () => {
    it("returns an array", async () => {
      const dayTypes = await lmsDayTypeAdminApi.getDayTypes();

      expect(Array.isArray(dayTypes)).toBe(true);
    });
  });

  describe("createDayType", () => {
    it("creates and returns mapped day type", async () => {
      const data = baseDayTypeData();
      const dayType = await lmsDayTypeAdminApi.createDayType(data);

      toCleanup.push({ table: "dayType", id: dayType.id });

      expect(dayType.id).toBeDefined();
      expect(dayType.name).toBe(data.name);
      expect(dayType.color).toBe("#1976d2");
    });

    it("rejects exact duplicate name with ConflictError", async () => {
      const data = baseDayTypeData();
      const created = await lmsDayTypeAdminApi.createDayType(data);

      toCleanup.push({ table: "dayType", id: created.id });

      await expect(lmsDayTypeAdminApi.createDayType(data)).rejects.toThrow(ConflictError);
    });

    it("rejects case-insensitive duplicate name with ConflictError", async () => {
      const data = baseDayTypeData({ name: uniqueName("ci-day") });
      const created = await lmsDayTypeAdminApi.createDayType(data);

      toCleanup.push({ table: "dayType", id: created.id });

      await expect(
        lmsDayTypeAdminApi.createDayType({ ...data, name: data.name.toUpperCase() }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("getDayTypeById", () => {
    it("returns day type by ID", async () => {
      const created = await lmsDayTypeAdminApi.createDayType(baseDayTypeData());

      toCleanup.push({ table: "dayType", id: created.id });

      const found = await lmsDayTypeAdminApi.getDayTypeById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.color).toBe(created.color);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(lmsDayTypeAdminApi.getDayTypeById("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updateDayType", () => {
    it("updates color", async () => {
      const created = await lmsDayTypeAdminApi.createDayType(baseDayTypeData());

      toCleanup.push({ table: "dayType", id: created.id });

      const updated = await lmsDayTypeAdminApi.updateDayType(created.id, {
        color: "#abcdef",
      });

      expect(updated.color).toBe("#abcdef");
    });

    it("rejects rename to existing other name with ConflictError", async () => {
      const first = await lmsDayTypeAdminApi.createDayType(baseDayTypeData());

      toCleanup.push({ table: "dayType", id: first.id });

      const second = await lmsDayTypeAdminApi.createDayType(baseDayTypeData());

      toCleanup.push({ table: "dayType", id: second.id });

      await expect(
        lmsDayTypeAdminApi.updateDayType(second.id, { name: first.name }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(
        lmsDayTypeAdminApi.updateDayType("non-existent-id", { color: "#000000" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteDayType", () => {
    it("soft-deletes day type (invisible after)", async () => {
      const created = await lmsDayTypeAdminApi.createDayType(baseDayTypeData());

      toCleanup.push({ table: "dayType", id: created.id });

      await lmsDayTypeAdminApi.deleteDayType(created.id);

      await expect(lmsDayTypeAdminApi.getDayTypeById(created.id)).rejects.toThrow(NotFoundError);
    });

    it("allows recreating with the same name after soft-delete", async () => {
      const reusableName = uniqueName("recreate-day");
      const first = await lmsDayTypeAdminApi.createDayType(baseDayTypeData({ name: reusableName }));

      toCleanup.push({ table: "dayType", id: first.id });

      await lmsDayTypeAdminApi.deleteDayType(first.id);

      const second = await lmsDayTypeAdminApi.createDayType(
        baseDayTypeData({ name: reusableName }),
      );

      toCleanup.push({ table: "dayType", id: second.id });

      expect(second.id).not.toBe(first.id);
      expect(second.name).toBe(reusableName);
    });
  });

  describe("getDayTypesPageData", () => {
    it("returns shape with dayTypes array", async () => {
      const pageData = await lmsDayTypeAdminApi.getDayTypesPageData();

      expect(pageData).toHaveProperty("dayTypes");
      expect(Array.isArray(pageData.dayTypes)).toBe(true);
    });
  });
});
