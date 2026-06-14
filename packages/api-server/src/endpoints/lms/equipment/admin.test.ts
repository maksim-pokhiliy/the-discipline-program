import { afterEach, describe, expect, it } from "vitest";

import {
  type CreateEquipmentData,
  getEquipmentResponseSchema,
} from "@repo/contracts/lms/equipment";
import { BadRequestError, ConflictError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { cmsExerciseAdminApi } from "../exercise/admin";

import { cmsEquipmentAdminApi } from "./admin";

const NON_EXISTENT_ID = "clz0000000000000000000000";

const baseEquipmentData = (overrides: Partial<CreateEquipmentData> = {}): CreateEquipmentData => ({
  name: `Test Equipment ${crypto.randomUUID().slice(0, 8)}`,
  notes: null,
  ...overrides,
});

describe("cmsEquipmentAdminApi", () => {
  const createdEquipmentIds: string[] = [];
  const createdExerciseIds: string[] = [];

  afterEach(async () => {
    for (const id of createdExerciseIds.splice(0).reverse()) {
      await cleanupRaw.exercise.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdEquipmentIds.splice(0).reverse()) {
      await cleanupRaw.equipment.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("createEquipment", () => {
    it("creates equipment and derives nameLower from the name", async () => {
      const created = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: " Olympic Barbell ", notes: "20kg men's bar" }),
      );

      createdEquipmentIds.push(created.id);

      expect(created.name).toBe(" Olympic Barbell ");
      expect(created.nameLower).toBe("olympic barbell");
      expect(created.notes).toBe("20kg men's bar");
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it("rejects a case-folded duplicate name with a P2002 ConflictError", async () => {
      const name = `Kettlebell ${crypto.randomUUID().slice(0, 8)}`;
      const first = await cmsEquipmentAdminApi.createEquipment(baseEquipmentData({ name }));

      createdEquipmentIds.push(first.id);

      await expect(
        cmsEquipmentAdminApi.createEquipment(baseEquipmentData({ name: name.toUpperCase() })),
      ).rejects.toThrow(ConflictError);

      await expect(
        cmsEquipmentAdminApi.createEquipment(baseEquipmentData({ name: ` ${name} ` })),
      ).rejects.toMatchObject({ details: { field: "name" } });

      const count = await cleanupRaw.equipment.count({
        where: { nameLower: name.toLowerCase() },
      });

      expect(count).toBe(1);
    });
  });

  describe("getEquipmentById", () => {
    it("returns the stored equipment by id", async () => {
      const created = await cmsEquipmentAdminApi.createEquipment(baseEquipmentData());

      createdEquipmentIds.push(created.id);

      const fetched = await cmsEquipmentAdminApi.getEquipmentById(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.nameLower).toBe(created.nameLower);
    });

    it("rejects a non-existent id with NotFoundError", async () => {
      await expect(cmsEquipmentAdminApi.getEquipmentById(NON_EXISTENT_ID)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getEquipment", () => {
    it("returns rows ordered by createdAt desc", async () => {
      const first = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: `Order First ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdEquipmentIds.push(first.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const second = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: `Order Second ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdEquipmentIds.push(second.id);

      await new Promise((resolve) => setTimeout(resolve, 5));

      const third = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: `Order Third ${crypto.randomUUID().slice(0, 6)}` }),
      );

      createdEquipmentIds.push(third.id);

      const rows = await cmsEquipmentAdminApi.getEquipment();
      const ids = rows.map((row) => row.id);

      expect(ids.indexOf(third.id)).toBeLessThan(ids.indexOf(second.id));
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("returns rows that satisfy the contract response schema", async () => {
      const created = await cmsEquipmentAdminApi.createEquipment(baseEquipmentData());

      createdEquipmentIds.push(created.id);

      const rows = await cmsEquipmentAdminApi.getEquipment();

      expect(() => getEquipmentResponseSchema.parse(rows)).not.toThrow();
    });
  });

  describe("updateEquipment", () => {
    it("recomputes nameLower on a name change", async () => {
      const created = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: `Rename Me ${crypto.randomUUID().slice(0, 8)}` }),
      );

      createdEquipmentIds.push(created.id);

      const renamed = `Plyo Box ${crypto.randomUUID().slice(0, 8)}`;
      const updated = await cmsEquipmentAdminApi.updateEquipment(created.id, { name: renamed });

      expect(updated.name).toBe(renamed);
      expect(updated.nameLower).toBe(renamed.toLowerCase());
    });

    it("rejects renaming onto an existing name with a P2002 ConflictError", async () => {
      const taken = `Taken ${crypto.randomUUID().slice(0, 8)}`;
      const first = await cmsEquipmentAdminApi.createEquipment(baseEquipmentData({ name: taken }));

      createdEquipmentIds.push(first.id);

      const second = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: `Free ${crypto.randomUUID().slice(0, 8)}` }),
      );

      createdEquipmentIds.push(second.id);

      await expect(
        cmsEquipmentAdminApi.updateEquipment(second.id, { name: taken.toUpperCase() }),
      ).rejects.toMatchObject({ details: { field: "name" } });
    });

    it("rejects update on a non-existent equipment with NotFoundError", async () => {
      await expect(
        cmsEquipmentAdminApi.updateEquipment(NON_EXISTENT_ID, { name: "x" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getEquipmentPageData", () => {
    it("wraps the equipment list under the equipment key", async () => {
      const created = await cmsEquipmentAdminApi.createEquipment(baseEquipmentData());

      createdEquipmentIds.push(created.id);

      const pageData = await cmsEquipmentAdminApi.getEquipmentPageData();

      expect(pageData.equipment.some((row) => row.id === created.id)).toBe(true);
    });
  });

  describe("deleteEquipment", () => {
    it("deletes an unused equipment", async () => {
      const created = await cmsEquipmentAdminApi.createEquipment(baseEquipmentData());

      await cmsEquipmentAdminApi.deleteEquipment(created.id);

      const after = await cleanupRaw.equipment.findUnique({ where: { id: created.id } });

      expect(after).toBeNull();
    });

    it("rejects deleting equipment assigned to an exercise with a 409 (P2003/Restrict)", async () => {
      const equipment = await cmsEquipmentAdminApi.createEquipment(
        baseEquipmentData({ name: `In Use ${crypto.randomUUID().slice(0, 8)}` }),
      );

      createdEquipmentIds.push(equipment.id);

      const exercise = await cmsExerciseAdminApi.createExercise({
        canonicalName: `Equipment Delete Guard ${crypto.randomUUID().slice(0, 8)}`,
        nature: "CONCRETE",
        movementFamily: null,
        defaultDemoUrls: [],
        aliases: [],
        equipmentIds: [equipment.id],
        notes: null,
      });

      createdExerciseIds.push(exercise.id);

      const error = await cmsEquipmentAdminApi
        .deleteEquipment(equipment.id)
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error).not.toBeInstanceOf(BadRequestError);
      expect(error).toMatchObject({
        message: "Cannot delete: equipment is in use",
        details: { entity: "Equipment", relation: "assignments" },
      });

      const stored = await cleanupRaw.equipment.findUnique({ where: { id: equipment.id } });

      expect(stored).not.toBeNull();
    });

    it("rejects delete on a non-existent equipment with NotFoundError", async () => {
      await expect(cmsEquipmentAdminApi.deleteEquipment(NON_EXISTENT_ID)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
