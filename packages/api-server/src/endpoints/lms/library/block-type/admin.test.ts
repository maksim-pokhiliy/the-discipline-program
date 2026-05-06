import { afterAll, describe, expect, it } from "vitest";

import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanup } from "../../../../test/helpers";

import { lmsBlockTypeAdminApi } from "./admin";

const uniqueName = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const baseBlockTypeData = (overrides: Record<string, unknown> = {}) => ({
  name: uniqueName("test-block"),
  ...overrides,
});

describe("lmsBlockTypeAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getBlockTypes", () => {
    it("returns an array", async () => {
      const blockTypes = await lmsBlockTypeAdminApi.getBlockTypes();

      expect(Array.isArray(blockTypes)).toBe(true);
    });
  });

  describe("createBlockType", () => {
    it("creates with required name only", async () => {
      const data = baseBlockTypeData();
      const blockType = await lmsBlockTypeAdminApi.createBlockType(data);

      toCleanup.push({ table: "blockType", id: blockType.id });

      expect(blockType.id).toBeDefined();
      expect(blockType.name).toBe(data.name);
      expect(blockType.description).toBeNull();
    });

    it("creates with description", async () => {
      const data = baseBlockTypeData({ description: "Strength block" });
      const blockType = await lmsBlockTypeAdminApi.createBlockType(data);

      toCleanup.push({ table: "blockType", id: blockType.id });

      expect(blockType.description).toBe("Strength block");
    });

    it("creates with explicit null description", async () => {
      const data = baseBlockTypeData({ description: null });
      const blockType = await lmsBlockTypeAdminApi.createBlockType(data);

      toCleanup.push({ table: "blockType", id: blockType.id });

      expect(blockType.description).toBeNull();
    });

    it("rejects exact duplicate name with ConflictError", async () => {
      const data = baseBlockTypeData();
      const created = await lmsBlockTypeAdminApi.createBlockType(data);

      toCleanup.push({ table: "blockType", id: created.id });

      await expect(lmsBlockTypeAdminApi.createBlockType(data)).rejects.toThrow(ConflictError);
    });

    it("rejects case-insensitive duplicate name with ConflictError", async () => {
      const data = baseBlockTypeData({ name: uniqueName("ci-block") });
      const created = await lmsBlockTypeAdminApi.createBlockType(data);

      toCleanup.push({ table: "blockType", id: created.id });

      await expect(
        lmsBlockTypeAdminApi.createBlockType({ ...data, name: data.name.toUpperCase() }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("getBlockTypeById", () => {
    it("returns block type by ID", async () => {
      const created = await lmsBlockTypeAdminApi.createBlockType(baseBlockTypeData());

      toCleanup.push({ table: "blockType", id: created.id });

      const found = await lmsBlockTypeAdminApi.getBlockTypeById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(lmsBlockTypeAdminApi.getBlockTypeById("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updateBlockType", () => {
    it("updates name and description", async () => {
      const created = await lmsBlockTypeAdminApi.createBlockType(
        baseBlockTypeData({ description: "old" }),
      );

      toCleanup.push({ table: "blockType", id: created.id });

      const updated = await lmsBlockTypeAdminApi.updateBlockType(created.id, {
        name: uniqueName("updated-block"),
        description: "new",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.description).toBe("new");
    });

    it("clears description when explicit null is sent", async () => {
      const created = await lmsBlockTypeAdminApi.createBlockType(
        baseBlockTypeData({ description: "to-clear" }),
      );

      toCleanup.push({ table: "blockType", id: created.id });

      const updated = await lmsBlockTypeAdminApi.updateBlockType(created.id, {
        description: null,
      });

      expect(updated.description).toBeNull();
    });

    it("preserves description when field is omitted", async () => {
      const created = await lmsBlockTypeAdminApi.createBlockType(
        baseBlockTypeData({ description: "kept" }),
      );

      toCleanup.push({ table: "blockType", id: created.id });

      const updated = await lmsBlockTypeAdminApi.updateBlockType(created.id, {
        name: uniqueName("renamed-block"),
      });

      expect(updated.description).toBe("kept");
    });

    it("rejects rename to existing other name with ConflictError", async () => {
      const first = await lmsBlockTypeAdminApi.createBlockType(baseBlockTypeData());

      toCleanup.push({ table: "blockType", id: first.id });

      const second = await lmsBlockTypeAdminApi.createBlockType(baseBlockTypeData());

      toCleanup.push({ table: "blockType", id: second.id });

      await expect(
        lmsBlockTypeAdminApi.updateBlockType(second.id, { name: first.name }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(
        lmsBlockTypeAdminApi.updateBlockType("non-existent-id", { description: "x" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteBlockType", () => {
    it("soft-deletes block type (invisible after)", async () => {
      const created = await lmsBlockTypeAdminApi.createBlockType(baseBlockTypeData());

      toCleanup.push({ table: "blockType", id: created.id });

      await lmsBlockTypeAdminApi.deleteBlockType(created.id);

      await expect(lmsBlockTypeAdminApi.getBlockTypeById(created.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("allows recreating with the same name after soft-delete", async () => {
      const reusableName = uniqueName("recreate-block");
      const first = await lmsBlockTypeAdminApi.createBlockType(
        baseBlockTypeData({ name: reusableName }),
      );

      toCleanup.push({ table: "blockType", id: first.id });

      await lmsBlockTypeAdminApi.deleteBlockType(first.id);

      const second = await lmsBlockTypeAdminApi.createBlockType(
        baseBlockTypeData({ name: reusableName }),
      );

      toCleanup.push({ table: "blockType", id: second.id });

      expect(second.id).not.toBe(first.id);
      expect(second.name).toBe(reusableName);
    });
  });

  describe("getBlockTypesPageData", () => {
    it("returns shape with blockTypes array", async () => {
      const pageData = await lmsBlockTypeAdminApi.getBlockTypesPageData();

      expect(pageData).toHaveProperty("blockTypes");
      expect(Array.isArray(pageData.blockTypes)).toBe(true);
    });
  });
});
