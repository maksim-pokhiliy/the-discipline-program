import { afterEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  createLabelSchema,
  type CreateLabelData,
  getLabelsResponseSchema,
} from "@repo/contracts/lms/label";
import { BadRequestError, ConflictError } from "@repo/errors";

import { cleanupRaw, createTestPlan, createTestUser } from "../../../test/helpers";

import { cmsLabelAdminApi } from "./admin";

const ZERO_WIDTH_SPACE = "​";

const baseLabelData = (overrides: Partial<CreateLabelData> = {}): CreateLabelData => ({
  name: `Test Label ${crypto.randomUUID().slice(0, 8)}`,
  applicableLevels: ["DAY"],
  notes: null,
  ...overrides,
});

const parseInput = (overrides: Partial<CreateLabelData> = {}): CreateLabelData =>
  createLabelSchema.parse(baseLabelData(overrides));

describe("cmsLabelAdminApi", () => {
  const createdLabelIds: string[] = [];
  const createdDayIds: string[] = [];
  const createdWeekIds: string[] = [];
  const createdPlanIds: string[] = [];
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdDayIds.splice(0).reverse()) {
      await cleanupRaw.day.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdWeekIds.splice(0).reverse()) {
      await cleanupRaw.week.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdPlanIds.splice(0).reverse()) {
      await cleanupRaw.trainingPlan.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdUserIds.splice(0).reverse()) {
      await cleanupRaw.user.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdLabelIds.splice(0).reverse()) {
      await cleanupRaw.label.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("createLabel — uniqueness (QA-Must-3)", () => {
    it("rejects case-insensitive duplicate names with a P2002 ConflictError", async () => {
      const first = await cmsLabelAdminApi.createLabel(parseInput({ name: "Push Day" }));

      createdLabelIds.push(first.id);

      await expect(cmsLabelAdminApi.createLabel(parseInput({ name: "push day" }))).rejects.toThrow(
        ConflictError,
      );

      await expect(
        cmsLabelAdminApi.createLabel(parseInput({ name: "PUSH DAY" })),
      ).rejects.toMatchObject({ details: { field: "name" } });

      await expect(
        cmsLabelAdminApi.createLabel(parseInput({ name: " Push Day " })),
      ).rejects.toMatchObject({ details: { field: "name" } });
    });

    it("treats zero-width-normalized names as colliding (QA-Must-4)", async () => {
      const cleanName = `Deload Week ${crypto.randomUUID().slice(0, 6)}`;
      const dirtyName = `${cleanName}${ZERO_WIDTH_SPACE}`;

      const first = await cmsLabelAdminApi.createLabel(parseInput({ name: dirtyName }));

      createdLabelIds.push(first.id);

      expect(first.nameLower).toBe(cleanName.toLowerCase());

      await expect(cmsLabelAdminApi.createLabel(parseInput({ name: cleanName }))).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("CRUD happy paths (QA-Must-10)", () => {
    it("creates a label, round-tripping applicableLevels and deriving nameLower", async () => {
      const created = await cmsLabelAdminApi.createLabel(
        parseInput({
          name: " Conditioning Block ",
          applicableLevels: ["DAY", "SESSION", "BLOCK"],
          notes: "Used for metcon days.",
        }),
      );

      createdLabelIds.push(created.id);

      expect(created.name).toBe("Conditioning Block");
      expect(created.nameLower).toBe("conditioning block");
      expect(created.applicableLevels).toEqual(["DAY", "SESSION", "BLOCK"]);
      expect(created.notes).toBe("Used for metcon days.");
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it("re-derives nameLower when the name changes on update", async () => {
      const created = await cmsLabelAdminApi.createLabel(baseLabelData({ name: "Original Name" }));

      createdLabelIds.push(created.id);

      const updated = await cmsLabelAdminApi.updateLabel(created.id, {
        name: "Renamed Label",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Renamed Label");
      expect(updated.nameLower).toBe("renamed label");
    });

    it("allows updating a label with its own name (self-update idempotence)", async () => {
      const created = await cmsLabelAdminApi.createLabel(
        baseLabelData({ name: "Self Update Label" }),
      );

      createdLabelIds.push(created.id);

      const updated = await cmsLabelAdminApi.updateLabel(created.id, {
        name: "Self Update Label",
        notes: "added a note",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.nameLower).toBe("self update label");
      expect(updated.notes).toBe("added a note");
    });

    it("deletes an unused label", async () => {
      const created = await cmsLabelAdminApi.createLabel(baseLabelData({ name: "Unused Label" }));

      await expect(cmsLabelAdminApi.deleteLabel(created.id)).resolves.toBeUndefined();

      await expect(cmsLabelAdminApi.getLabelById(created.id)).rejects.toThrow();
    });

    it("rejects renaming a label to an existing name with a P2002 ConflictError", async () => {
      const first = await cmsLabelAdminApi.createLabel(baseLabelData({ name: "Conflict Label A" }));

      createdLabelIds.push(first.id);

      const second = await cmsLabelAdminApi.createLabel(
        baseLabelData({ name: "Conflict Label B" }),
      );

      createdLabelIds.push(second.id);

      await expect(
        cmsLabelAdminApi.updateLabel(second.id, { name: "conflict label a" }),
      ).rejects.toMatchObject({ details: { field: "name" } });
    });
  });

  describe("getLabels (QA-Must-11)", () => {
    it("returns rows ordered by createdAt desc", async () => {
      const first = await cmsLabelAdminApi.createLabel(
        baseLabelData({ name: `Order First ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdLabelIds.push(first.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const second = await cmsLabelAdminApi.createLabel(
        baseLabelData({ name: `Order Second ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdLabelIds.push(second.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const third = await cmsLabelAdminApi.createLabel(
        baseLabelData({ name: `Order Third ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdLabelIds.push(third.id);

      const labels = await cmsLabelAdminApi.getLabels();
      const ids = labels.map((row) => row.id);

      expect(ids.indexOf(third.id)).toBeLessThan(ids.indexOf(second.id));
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("caps the response at DEFAULT_LIST_LIMIT", async () => {
      const labels = await cmsLabelAdminApi.getLabels();

      expect(labels.length).toBeLessThanOrEqual(100);
    });
  });

  describe("deleteLabel — P2003 intercept (QA-Must-12)", () => {
    it("throws a ConflictError with relation context when a Day references the label", async () => {
      const created = await cmsLabelAdminApi.createLabel(
        baseLabelData({ name: "Referenced Label" }),
      );

      createdLabelIds.push(created.id);

      const user = await createTestUser();

      createdUserIds.push(user.id);

      const plan = await createTestPlan(user.id);

      createdPlanIds.push(plan.id);

      const week = await cleanupRaw.week.create({
        data: { planId: plan.id, startDate: new Date("2026-01-05") },
      });

      createdWeekIds.push(week.id);

      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MONDAY", labelId: created.id },
      });

      createdDayIds.push(day.id);

      const error = await cmsLabelAdminApi
        .deleteLabel(created.id)
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error).not.toBeInstanceOf(BadRequestError);
      expect(error).toMatchObject({
        message: "Cannot delete: label is in use",
        details: { entity: "Label", relation: "days/sessions/blockAssignments" },
      });
    });
  });

  describe("mapToLabel — Json column trust (QA-Must-13)", () => {
    it("throws a ZodError when the read path re-parses a malformed applicableLevels row", async () => {
      const malformed = await cleanupRaw.label.create({
        data: {
          name: `Malformed Label ${crypto.randomUUID().slice(0, 8)}`,
          nameLower: `malformed label ${crypto.randomUUID().slice(0, 8)}`,
          applicableLevels: ["GARBAGE"],
          notes: null,
        },
      });

      createdLabelIds.push(malformed.id);

      await expect(async () =>
        getLabelsResponseSchema.parse(await cmsLabelAdminApi.getLabels()),
      ).rejects.toThrow(ZodError);
    });
  });
});
