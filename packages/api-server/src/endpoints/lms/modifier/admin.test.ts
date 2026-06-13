import { afterAll, describe, expect, it } from "vitest";

import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { cmsModifierAdminApi } from "./admin";

describe("cmsModifierAdminApi", () => {
  const createdModifierIds: string[] = [];

  const trackModifier = (id: string): string => {
    createdModifierIds.push(id);

    return id;
  };

  afterAll(async () => {
    await cleanupRaw.modifier
      .deleteMany({ where: { id: { in: createdModifierIds } } })
      .catch(() => {});
  });

  describe("createModifier", () => {
    it("creates a modifier and lowercases the name into nameLower", async () => {
      const name = `From Sofa ${crypto.randomUUID().slice(0, 8)}`;
      const created = await cmsModifierAdminApi.createModifier({ name });

      trackModifier(created.id);

      expect(created.name).toBe(name);

      const stored = await cleanupRaw.modifier.findUnique({ where: { id: created.id } });

      expect(stored?.nameLower).toBe(name.toLowerCase());
    });

    it("persists an optional notes list", async () => {
      const created = await cmsModifierAdminApi.createModifier({
        name: `Neutral Grip ${crypto.randomUUID().slice(0, 8)}`,
        notes: ["thumbs facing in"],
      });

      trackModifier(created.id);

      expect(created.notes).toEqual(["thumbs facing in"]);
    });

    it("rejects a duplicate name (case-folded) with a 409 ConflictError (QA-#10)", async () => {
      const name = `Box Or Sofa ${crypto.randomUUID().slice(0, 8)}`;
      const first = await cmsModifierAdminApi.createModifier({ name });

      trackModifier(first.id);

      await expect(
        cmsModifierAdminApi.createModifier({ name: name.toUpperCase() }),
      ).rejects.toThrow(ConflictError);

      const count = await cleanupRaw.modifier.count({
        where: { nameLower: name.toLowerCase() },
      });

      expect(count).toBe(1);
    });
  });

  describe("updateModifier", () => {
    it("recomputes nameLower on a name change", async () => {
      const created = await cmsModifierAdminApi.createModifier({
        name: `Rename Me ${crypto.randomUUID().slice(0, 8)}`,
      });

      trackModifier(created.id);

      const renamed = `Hands On DB ${crypto.randomUUID().slice(0, 8)}`;
      const updated = await cmsModifierAdminApi.updateModifier(created.id, { name: renamed });

      expect(updated.name).toBe(renamed);

      const stored = await cleanupRaw.modifier.findUnique({ where: { id: created.id } });

      expect(stored?.nameLower).toBe(renamed.toLowerCase());
    });

    it("rejects renaming onto an existing name with a 409 (QA-#10)", async () => {
      const taken = `Taken ${crypto.randomUUID().slice(0, 8)}`;
      const first = await cmsModifierAdminApi.createModifier({ name: taken });
      const second = await cmsModifierAdminApi.createModifier({
        name: `Free ${crypto.randomUUID().slice(0, 8)}`,
      });

      trackModifier(first.id);
      trackModifier(second.id);

      await expect(cmsModifierAdminApi.updateModifier(second.id, { name: taken })).rejects.toThrow(
        ConflictError,
      );
    });

    it("rejects update on a non-existent modifier", async () => {
      await expect(
        cmsModifierAdminApi.updateModifier("clz0000000000000000000000", { name: "x" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteModifier", () => {
    it("deletes an unused modifier (QA-#10)", async () => {
      const created = await cmsModifierAdminApi.createModifier({
        name: `Disposable ${crypto.randomUUID().slice(0, 8)}`,
      });

      await cmsModifierAdminApi.deleteModifier(created.id);

      const after = await cleanupRaw.modifier.findUnique({ where: { id: created.id } });

      expect(after).toBeNull();
    });

    it("rejects deleting a modifier that is assigned to a row with a 409 (P2003/Restrict, QA-#10)", async () => {
      const coach = await createTestCoach();
      const plan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const week = await cleanupRaw.week.create({
        data: { planId: plan.id, startDate: new Date(Date.UTC(2026, 2, 2)) },
      });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MONDAY" },
      });
      const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
      const block = await cleanupRaw.block.create({ data: { sessionId: session.id, order: 10 } });
      const schema = await cleanupRaw.schema.create({ data: { blockId: block.id, order: 10 } });
      const unique = crypto.randomUUID().slice(0, 8);
      const exercise = await cleanupRaw.exercise.create({
        data: {
          canonicalName: `Modifier Delete Exercise ${unique}`,
          canonicalNameLower: `modifier delete exercise ${unique}`,
          primaryEquipment: "BARBELL",
          movementTypeTagPrimary: "SQUAT",
          canonicalCompoundType: "ATOMIC",
          placeholderFlag: false,
          defaultDemoUrls: [],
        },
      });
      const row = await cleanupRaw.schemaRow.create({
        data: { schemaId: schema.id, order: 10, exerciseId: exercise.id },
      });
      const created = await cmsModifierAdminApi.createModifier({
        name: `In Use ${unique}`,
      });

      trackModifier(created.id);

      const assignment = await cleanupRaw.rowModifierAssignment.create({
        data: { rowId: row.id, modifierId: created.id, order: 0 },
      });

      try {
        await expect(cmsModifierAdminApi.deleteModifier(created.id)).rejects.toThrow(ConflictError);

        const stored = await cleanupRaw.modifier.findUnique({ where: { id: created.id } });

        expect(stored).not.toBeNull();
      } finally {
        await cleanupRaw.rowModifierAssignment
          .delete({ where: { id: assignment.id } })
          .catch(() => {});
        await cleanupRaw.schemaRow.delete({ where: { id: row.id } }).catch(() => {});
        await cleanupRaw.schema.delete({ where: { id: schema.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
        await cleanupRaw.trainingPlan.delete({ where: { id: plan.id } }).catch(() => {});
        await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
        await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
      }
    });

    it("rejects delete on a non-existent modifier", async () => {
      await expect(cmsModifierAdminApi.deleteModifier("clz0000000000000000000000")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
