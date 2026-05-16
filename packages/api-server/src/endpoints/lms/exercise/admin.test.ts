import { afterEach, describe, expect, it } from "vitest";

import { createExerciseSchema, type CreateExerciseData } from "@repo/contracts/lms/exercise";
import { ConflictError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import { cmsExerciseAdminApi } from "./admin";

const ZERO_WIDTH_SPACE = "​";

const baseExerciseData = (overrides: Partial<CreateExerciseData> = {}): CreateExerciseData => ({
  canonicalName: `Test Exercise ${crypto.randomUUID().slice(0, 8)}`,
  primaryEquipment: "BARBELL",
  movementTypeTagPrimary: "SQUAT",
  movementTypeTagSecondary: null,
  canonicalCompoundType: "ATOMIC",
  placeholderFlag: false,
  movementFamily: null,
  defaultDemoUrls: [],
  aliases: [],
  notes: null,
  ...overrides,
});

const parseInput = (overrides: Partial<CreateExerciseData> = {}): CreateExerciseData =>
  createExerciseSchema.parse(baseExerciseData(overrides));

describe("cmsExerciseAdminApi", () => {
  const createdIds: string[] = [];
  const createdOneRMIds: string[] = [];
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdOneRMIds.splice(0).reverse()) {
      await cleanupRaw.oneRMRecord.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdIds.splice(0).reverse()) {
      await cleanupRaw.exercise.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdUserIds.splice(0).reverse()) {
      await cleanupRaw.user.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("createExercise — uniqueness", () => {
    it("rejects mixed-case duplicate name with P2002 intercept (QA-Must-2, AC-T13)", async () => {
      const first = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: "Back Squat Mixed Case" }),
      );

      createdIds.push(first.id);

      await expect(
        cmsExerciseAdminApi.createExercise(
          baseExerciseData({ canonicalName: "back squat mixed case" }),
        ),
      ).rejects.toThrow(ConflictError);

      await expect(
        cmsExerciseAdminApi.createExercise(
          baseExerciseData({ canonicalName: "BACK SQUAT MIXED CASE" }),
        ),
      ).rejects.toMatchObject({
        details: { field: "canonicalName" },
      });
    });

    it("normalizes zero-width chars so visually identical names collide (QA-Must-1)", async () => {
      const cleanName = `Back Squat ZWSP ${crypto.randomUUID().slice(0, 6)}`;
      const dirtyName = `${cleanName}${ZERO_WIDTH_SPACE}`;

      const first = await cmsExerciseAdminApi.createExercise(
        parseInput({ canonicalName: dirtyName }),
      );

      createdIds.push(first.id);

      expect(first.canonicalNameLower).toBe(cleanName.toLowerCase());

      await expect(
        cmsExerciseAdminApi.createExercise(parseInput({ canonicalName: cleanName })),
      ).rejects.toThrow(ConflictError);
    });

    it("allows updating a row with its own canonicalName (self-update idempotence, QA-Must-3)", async () => {
      const created = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: "Self Update Squat" }),
      );

      createdIds.push(created.id);

      const updated = await cmsExerciseAdminApi.updateExercise(created.id, {
        canonicalName: "Self Update Squat",
        notes: "added a note",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.canonicalNameLower).toBe("self update squat");
      expect(updated.notes).toBe("added a note");
    });
  });

  describe("updateExercise — P2002 intercept (QA-Must-4)", () => {
    it("rejects renaming to an existing canonicalName with ConflictError", async () => {
      const first = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: "Back Squat Update Conflict" }),
      );

      createdIds.push(first.id);

      const second = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: "Front Squat Update Conflict" }),
      );

      createdIds.push(second.id);

      await expect(
        cmsExerciseAdminApi.updateExercise(second.id, {
          canonicalName: "back squat update conflict",
        }),
      ).rejects.toMatchObject({
        details: { field: "canonicalName" },
      });
    });
  });

  describe("deleteExercise — P2003 intercept (QA-Must-5)", () => {
    it("throws ConflictError with relation context when 1RM record references the exercise", async () => {
      const created = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: "1RM Referenced Squat" }),
      );

      createdIds.push(created.id);

      const user = await cleanupRaw.user.create({
        data: {
          email: `1rm-${crypto.randomUUID()}@test.local`,
          name: "1RM Test User",
        },
      });

      createdUserIds.push(user.id);

      const record = await cleanupRaw.oneRMRecord.create({
        data: {
          userId: user.id,
          exerciseId: created.id,
          valueKg: 100,
          recordedAt: new Date(),
          source: "MANUAL",
        },
      });

      createdOneRMIds.push(record.id);

      await expect(cmsExerciseAdminApi.deleteExercise(created.id)).rejects.toMatchObject({
        details: { entity: "Exercise", relation: "oneRMRecords" },
      });
    });
  });

  describe("getMovementFamilies (QA-Must-6)", () => {
    it("filters nulls, dedupes, and sorts ascending", async () => {
      const familyA = `family-a-${crypto.randomUUID().slice(0, 6)}`;
      const familyB = `family-b-${crypto.randomUUID().slice(0, 6)}`;

      const e1 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({
          canonicalName: `MF Exercise 1 ${crypto.randomUUID().slice(0, 6)}`,
          movementFamily: familyB,
        }),
      );

      createdIds.push(e1.id);

      const e2 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({
          canonicalName: `MF Exercise 2 ${crypto.randomUUID().slice(0, 6)}`,
          movementFamily: null,
        }),
      );

      createdIds.push(e2.id);

      const e3 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({
          canonicalName: `MF Exercise 3 ${crypto.randomUUID().slice(0, 6)}`,
          movementFamily: familyA,
        }),
      );

      createdIds.push(e3.id);

      const e4 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({
          canonicalName: `MF Exercise 4 ${crypto.randomUUID().slice(0, 6)}`,
          movementFamily: familyB,
        }),
      );

      createdIds.push(e4.id);

      const e5 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({
          canonicalName: `MF Exercise 5 ${crypto.randomUUID().slice(0, 6)}`,
          movementFamily: null,
        }),
      );

      createdIds.push(e5.id);

      const families = await cmsExerciseAdminApi.getMovementFamilies();

      expect(families).not.toContain(null);

      const aIdx = families.indexOf(familyA);
      const bIdx = families.indexOf(familyB);

      expect(aIdx).toBeGreaterThanOrEqual(0);
      expect(bIdx).toBeGreaterThan(aIdx);

      const scoped = families.filter((f) => f === familyA || f === familyB);

      expect(scoped).toEqual([familyA, familyB]);
    });
  });

  describe("getExercises (QA-Must-7)", () => {
    it("returns rows ordered by createdAt desc", async () => {
      const e1 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: `Order First ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdIds.push(e1.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const e2 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: `Order Second ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdIds.push(e2.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const e3 = await cmsExerciseAdminApi.createExercise(
        baseExerciseData({ canonicalName: `Order Third ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdIds.push(e3.id);

      const exercises = await cmsExerciseAdminApi.getExercises();
      const idsInList = exercises.map((row) => row.id);
      const indexOf = (id: string) => idsInList.indexOf(id);

      expect(indexOf(e3.id)).toBeLessThan(indexOf(e2.id));
      expect(indexOf(e2.id)).toBeLessThan(indexOf(e1.id));
    });

    it("caps the response at DEFAULT_LIST_LIMIT", async () => {
      const exercises = await cmsExerciseAdminApi.getExercises();

      expect(exercises.length).toBeLessThanOrEqual(100);
    });
  });

  describe("mapToExercise round-trip via createExercise (QA-Must-8)", () => {
    it("returns DTO with derived canonicalNameLower and round-tripped arrays/enums", async () => {
      const data = baseExerciseData({
        canonicalName: "Full Payload Exercise",
        primaryEquipment: "KETTLEBELL",
        movementTypeTagPrimary: "HINGE",
        movementTypeTagSecondary: "PULL",
        canonicalCompoundType: "COMPOUND_PLUS",
        placeholderFlag: false,
        movementFamily: "kettlebell-swings",
        defaultDemoUrls: ["https://example.com/swing-1", "https://example.com/swing-2"],
        aliases: ["Russian Swing", "American Swing"],
        notes: "Hip-dominant power production.",
      });

      const created = await cmsExerciseAdminApi.createExercise(data);

      createdIds.push(created.id);

      expect(created.canonicalName).toBe("Full Payload Exercise");
      expect(created.canonicalNameLower).toBe("full payload exercise");
      expect(created.primaryEquipment).toBe("KETTLEBELL");
      expect(created.movementTypeTagPrimary).toBe("HINGE");
      expect(created.movementTypeTagSecondary).toBe("PULL");
      expect(created.canonicalCompoundType).toBe("COMPOUND_PLUS");
      expect(created.placeholderFlag).toBe(false);
      expect(created.movementFamily).toBe("kettlebell-swings");
      expect(created.defaultDemoUrls).toEqual([
        "https://example.com/swing-1",
        "https://example.com/swing-2",
      ]);
      expect(created.aliases).toEqual(["Russian Swing", "American Swing"]);
      expect(created.notes).toBe("Hip-dominant power production.");
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      const fetched = await cmsExerciseAdminApi.getExerciseById(created.id);

      expect(fetched.defaultDemoUrls).toEqual(created.defaultDemoUrls);
      expect(fetched.aliases).toEqual(created.aliases);
      expect(fetched.canonicalNameLower).toBe(created.canonicalNameLower);
    });
  });
});
