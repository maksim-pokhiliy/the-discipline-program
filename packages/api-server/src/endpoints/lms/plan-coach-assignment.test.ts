import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanup, createTestCoach, createTestPlan, createTestUser } from "../../test/helpers";

import { lmsPlanCoachAssignmentApi } from "./plan-coach-assignment";

describe("lmsPlanCoachAssignmentApi", () => {
  let creator: Awaited<ReturnType<typeof createTestCoach>>;
  let coCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let outsider: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    creator = await createTestCoach();
    coCoach = await createTestCoach();
    outsider = await createTestCoach();
    athlete = await createTestUser();
    plan = await createTestPlan(creator.user.id);
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: creator.profile.id },
      { table: "coachProfile", id: coCoach.profile.id },
      { table: "coachProfile", id: outsider.profile.id },
      { table: "user", id: creator.user.id },
      { table: "user", id: coCoach.user.id },
      { table: "user", id: outsider.user.id },
      { table: "user", id: athlete.id },
    );
  });

  describe("create", () => {
    it("creates an assignment when called by the plan creator", async () => {
      const assignment = await lmsPlanCoachAssignmentApi.create(creator.user.id, plan.id, {
        coachId: coCoach.user.id,
        canEdit: true,
      });

      toCleanup.push({ table: "planCoachAssignment", id: assignment.id });

      expect(assignment.planId).toBe(plan.id);
      expect(assignment.coachId).toBe(coCoach.user.id);
      expect(assignment.canEdit).toBe(true);
      expect(assignment.grantedBy).toBe(creator.user.id);
    });

    it("rejects creation when caller does not own the plan", async () => {
      await expect(
        lmsPlanCoachAssignmentApi.create(outsider.user.id, plan.id, {
          coachId: coCoach.user.id,
          canEdit: true,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("rejects creation for non-coach target user", async () => {
      await expect(
        lmsPlanCoachAssignmentApi.create(creator.user.id, plan.id, {
          coachId: athlete.id,
          canEdit: true,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("list", () => {
    it("returns assignments for the plan when called by the creator", async () => {
      const result = await lmsPlanCoachAssignmentApi.list(creator.user.id, plan.id);

      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.items.some((i) => i.coachId === coCoach.user.id)).toBe(true);
    });

    it("returns assignments for the plan when called by an existing assignee", async () => {
      const result = await lmsPlanCoachAssignmentApi.list(coCoach.user.id, plan.id);

      expect(result.items.some((i) => i.coachId === coCoach.user.id)).toBe(true);
    });

    it("rejects listing when caller does not own the plan", async () => {
      await expect(
        lmsPlanCoachAssignmentApi.list(outsider.user.id, plan.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("removes an assignment when called by the plan creator", async () => {
      const tempCoach = await createTestCoach();

      toCleanup.push({ table: "user", id: tempCoach.user.id });
      toCleanup.push({ table: "coachProfile", id: tempCoach.profile.id });

      const assignment = await lmsPlanCoachAssignmentApi.create(creator.user.id, plan.id, {
        coachId: tempCoach.user.id,
        canEdit: true,
      });

      await lmsPlanCoachAssignmentApi.delete(creator.user.id, plan.id, assignment.id);

      const after = await lmsPlanCoachAssignmentApi.list(creator.user.id, plan.id);

      expect(after.items.some((i) => i.id === assignment.id)).toBe(false);
    });

    it("rejects deletion when caller does not own the plan", async () => {
      const stranger = await createTestCoach();
      const targetCoach = await createTestCoach();

      toCleanup.push({ table: "user", id: stranger.user.id });
      toCleanup.push({ table: "coachProfile", id: stranger.profile.id });
      toCleanup.push({ table: "user", id: targetCoach.user.id });
      toCleanup.push({ table: "coachProfile", id: targetCoach.profile.id });

      const assignment = await lmsPlanCoachAssignmentApi.create(creator.user.id, plan.id, {
        coachId: targetCoach.user.id,
        canEdit: true,
      });

      toCleanup.push({ table: "planCoachAssignment", id: assignment.id });

      await expect(
        lmsPlanCoachAssignmentApi.delete(stranger.user.id, plan.id, assignment.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("throws when assignment does not exist", async () => {
      const fakeId = "ckxxxxxxxxxxxxxxxxxxxxxxx";

      await expect(
        lmsPlanCoachAssignmentApi.delete(creator.user.id, plan.id, fakeId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
