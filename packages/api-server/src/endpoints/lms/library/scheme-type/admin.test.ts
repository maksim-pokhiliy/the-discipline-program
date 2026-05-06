import { afterAll, describe, expect, it } from "vitest";

import { ConflictError, NotFoundError, ValidationError } from "@repo/errors";

import { cleanup, cleanupRaw } from "../../../../test/helpers";

import { lmsSchemeTypeAdminApi } from "./admin";

const uniqueName = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const baseSchemeData = (overrides: Record<string, unknown> = {}) => ({
  name: uniqueName("test-scheme"),
  archetypeKind: "NONE" as const,
  ...overrides,
});

const distanceParams = {
  kind: "DISTANCE" as const,
  unit: "KM" as const,
  distanceMin: 5,
};

const countDownParams = {
  kind: "COUNT_DOWN" as const,
  durationSec: 600,
};

describe("lmsSchemeTypeAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getSchemeTypes", () => {
    it("returns an array", async () => {
      const schemeTypes = await lmsSchemeTypeAdminApi.getSchemeTypes();

      expect(Array.isArray(schemeTypes)).toBe(true);
    });
  });

  describe("createSchemeType", () => {
    it("creates with NONE archetype and no params", async () => {
      const data = baseSchemeData();
      const schemeType = await lmsSchemeTypeAdminApi.createSchemeType(data);

      toCleanup.push({ table: "schemeType", id: schemeType.id });

      expect(schemeType.id).toBeDefined();
      expect(schemeType.name).toBe(data.name);
      expect(schemeType.archetypeKind).toBe("NONE");
      expect(schemeType.defaultParams).toBeNull();
    });

    it("creates with matching archetype + defaultParams", async () => {
      const data = baseSchemeData({
        archetypeKind: "DISTANCE",
        defaultParams: distanceParams,
      });
      const schemeType = await lmsSchemeTypeAdminApi.createSchemeType(data);

      toCleanup.push({ table: "schemeType", id: schemeType.id });

      expect(schemeType.archetypeKind).toBe("DISTANCE");
      expect(schemeType.defaultParams).toEqual(distanceParams);
    });

    it("rejects mismatched archetypeKind / defaultParams.kind with ValidationError", async () => {
      await expect(
        lmsSchemeTypeAdminApi.createSchemeType(
          baseSchemeData({
            archetypeKind: "COUNT_UP",
            defaultParams: distanceParams,
          }),
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects exact duplicate name with ConflictError", async () => {
      const data = baseSchemeData();
      const created = await lmsSchemeTypeAdminApi.createSchemeType(data);

      toCleanup.push({ table: "schemeType", id: created.id });

      await expect(lmsSchemeTypeAdminApi.createSchemeType(data)).rejects.toThrow(ConflictError);
    });

    it("rejects case-insensitive duplicate name with ConflictError", async () => {
      const data = baseSchemeData({ name: uniqueName("ci-scheme") });
      const created = await lmsSchemeTypeAdminApi.createSchemeType(data);

      toCleanup.push({ table: "schemeType", id: created.id });

      await expect(
        lmsSchemeTypeAdminApi.createSchemeType({ ...data, name: data.name.toUpperCase() }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("getSchemeTypeById", () => {
    it("returns scheme type by ID", async () => {
      const created = await lmsSchemeTypeAdminApi.createSchemeType(baseSchemeData());

      toCleanup.push({ table: "schemeType", id: created.id });

      const found = await lmsSchemeTypeAdminApi.getSchemeTypeById(created.id);

      expect(found.id).toBe(created.id);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(lmsSchemeTypeAdminApi.getSchemeTypeById("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updateSchemeType", () => {
    it("updates name and archetype + matching params together", async () => {
      const created = await lmsSchemeTypeAdminApi.createSchemeType(baseSchemeData());

      toCleanup.push({ table: "schemeType", id: created.id });

      const updated = await lmsSchemeTypeAdminApi.updateSchemeType(created.id, {
        archetypeKind: "DISTANCE",
        defaultParams: distanceParams,
      });

      expect(updated.archetypeKind).toBe("DISTANCE");
      expect(updated.defaultParams).toEqual(distanceParams);
    });

    it("rejects partial payload with mismatched defaultParams against stored archetype", async () => {
      const created = await lmsSchemeTypeAdminApi.createSchemeType(
        baseSchemeData({ archetypeKind: "COUNT_DOWN" }),
      );

      toCleanup.push({ table: "schemeType", id: created.id });

      await expect(
        lmsSchemeTypeAdminApi.updateSchemeType(created.id, {
          defaultParams: distanceParams,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects partial payload with mismatched archetypeKind against stored defaultParams", async () => {
      const created = await lmsSchemeTypeAdminApi.createSchemeType(
        baseSchemeData({
          archetypeKind: "COUNT_DOWN",
          defaultParams: countDownParams,
        }),
      );

      toCleanup.push({ table: "schemeType", id: created.id });

      await expect(
        lmsSchemeTypeAdminApi.updateSchemeType(created.id, {
          archetypeKind: "DISTANCE",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects rename to existing other name with ConflictError", async () => {
      const first = await lmsSchemeTypeAdminApi.createSchemeType(baseSchemeData());

      toCleanup.push({ table: "schemeType", id: first.id });

      const second = await lmsSchemeTypeAdminApi.createSchemeType(baseSchemeData());

      toCleanup.push({ table: "schemeType", id: second.id });

      await expect(
        lmsSchemeTypeAdminApi.updateSchemeType(second.id, { name: first.name }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(
        lmsSchemeTypeAdminApi.updateSchemeType("non-existent-id", { archetypeKind: "NONE" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteSchemeType", () => {
    it("soft-deletes scheme type (invisible after)", async () => {
      const created = await lmsSchemeTypeAdminApi.createSchemeType(baseSchemeData());

      toCleanup.push({ table: "schemeType", id: created.id });

      await lmsSchemeTypeAdminApi.deleteSchemeType(created.id);

      await expect(lmsSchemeTypeAdminApi.getSchemeTypeById(created.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("allows recreating with the same name after soft-delete", async () => {
      const reusableName = uniqueName("recreate-scheme");
      const first = await lmsSchemeTypeAdminApi.createSchemeType(
        baseSchemeData({ name: reusableName }),
      );

      toCleanup.push({ table: "schemeType", id: first.id });

      await lmsSchemeTypeAdminApi.deleteSchemeType(first.id);

      const second = await lmsSchemeTypeAdminApi.createSchemeType(
        baseSchemeData({ name: reusableName }),
      );

      toCleanup.push({ table: "schemeType", id: second.id });

      expect(second.id).not.toBe(first.id);
      expect(second.name).toBe(reusableName);
    });
  });

  describe("mapToSchemeType (corrupt-row degradation)", () => {
    it("falls back to null defaultParams when stored Json fails schema parse", async () => {
      const created = await lmsSchemeTypeAdminApi.createSchemeType(baseSchemeData());

      toCleanup.push({ table: "schemeType", id: created.id });

      await cleanupRaw.schemeType.update({
        where: { id: created.id },
        data: { defaultParams: { kind: "INVALID_KIND_XYZ", garbage: true } },
      });

      const found = await lmsSchemeTypeAdminApi.getSchemeTypeById(created.id);

      expect(found.defaultParams).toBeNull();
    });
  });

  describe("getSchemeTypesPageData", () => {
    it("returns shape with schemeTypes array", async () => {
      const pageData = await lmsSchemeTypeAdminApi.getSchemeTypesPageData();

      expect(pageData).toHaveProperty("schemeTypes");
      expect(Array.isArray(pageData.schemeTypes)).toBe(true);
    });
  });
});
