import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ExerciseStatus } from "@repo/contracts/library/exercise";
import { ConflictError, NotFoundError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestWorkout,
} from "../../../test/helpers";
import {
  createTestBlockType,
  createTestExercise,
  createTestScheme,
} from "../../../test/library-helpers";

import { libraryExerciseAdminApi } from "./admin";

const toCleanup: { table: string; id: string }[] = [];

describe("libraryExerciseAdminApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let admin: Awaited<ReturnType<typeof createTestCoach>>;

  beforeEach(async () => {
    coach = await createTestCoach();
    admin = await createTestCoach();

    toCleanup.push(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "coachProfile", id: admin.profile.id },
      { table: "user", id: admin.user.id },
    );
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("approve", () => {
    it("transitions PENDING_REVIEW to APPROVED and sets reviewer fields", async () => {
      const exercise = await createTestExercise(coach.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: exercise.id });

      const approved = await libraryExerciseAdminApi.approve({
        id: exercise.id,
        reviewerUserId: admin.user.id,
      });

      expect(approved.status).toBe(ExerciseStatus.APPROVED);
      expect(approved.reviewedByUserId).toBe(admin.user.id);
      expect(approved.reviewedAt).not.toBeNull();
    });

    it("throws ConflictError when approving an already-APPROVED exercise", async () => {
      const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: exercise.id });

      await expect(
        libraryExerciseAdminApi.approve({ id: exercise.id, reviewerUserId: admin.user.id }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError when approving would create a duplicate with an APPROVED twin", async () => {
      const unique = crypto.randomUUID().slice(0, 8);
      const canonical = `Front Squat ${unique}`;
      const existing = await createTestExercise(coach.user.id, {
        status: "APPROVED",
        canonicalName: canonical,
        normalizedName: canonical.toLowerCase(),
      });
      const pending = await createTestExercise(coach.user.id, {
        status: "PENDING_REVIEW",
        canonicalName: canonical,
        normalizedName: canonical.toLowerCase(),
      });

      toCleanup.push({ table: "exercise", id: existing.id });
      toCleanup.push({ table: "exercise", id: pending.id });

      await expect(
        libraryExerciseAdminApi.approve({ id: pending.id, reviewerUserId: admin.user.id }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("reject", () => {
    it("transitions PENDING_REVIEW to REJECTED with review notes", async () => {
      const exercise = await createTestExercise(coach.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: exercise.id });

      const rejected = await libraryExerciseAdminApi.reject({
        id: exercise.id,
        reviewerUserId: admin.user.id,
        input: { reviewNotes: "Too vague" },
      });

      expect(rejected.status).toBe(ExerciseStatus.REJECTED);
      expect(rejected.reviewNotes).toBe("Too vague");
      expect(rejected.reviewedByUserId).toBe(admin.user.id);
    });

    it("throws ConflictError when rejecting a non-pending exercise", async () => {
      const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: exercise.id });

      await expect(
        libraryExerciseAdminApi.reject({
          id: exercise.id,
          reviewerUserId: admin.user.id,
          input: {},
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("merge", () => {
    let plan: Awaited<ReturnType<typeof createTestPlan>>;
    let workout: Awaited<ReturnType<typeof createTestWorkout>>;
    let blockType: Awaited<ReturnType<typeof createTestBlockType>>;
    let scheme: Awaited<ReturnType<typeof createTestScheme>>;

    beforeEach(async () => {
      plan = await createTestPlan(coach.profile.id);
      workout = await createTestWorkout(plan.id);
      blockType = await createTestBlockType();
      scheme = await createTestScheme();

      toCleanup.push(
        { table: "workout", id: workout.id },
        { table: "trainingPlan", id: plan.id },
        { table: "scheme", id: scheme.id },
        { table: "blockType", id: blockType.id },
      );
    });

    it("rewires WorkoutBlockExercise rows from source to target, archives source", async () => {
      const source = await createTestExercise(coach.user.id, { status: "APPROVED" });
      const target = await createTestExercise(coach.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: source.id });
      toCleanup.push({ table: "exercise", id: target.id });

      const block = await cleanupRaw.workoutBlock.create({
        data: {
          workoutId: workout.id,
          blockTypeId: blockType.id,
          sortOrder: 0,
        },
      });
      const section = await cleanupRaw.schemeSection.create({
        data: {
          blockId: block.id,
          kind: "SCHEME",
          schemeId: scheme.id,
          schemeKind: "STRAIGHT_SETS",
          sortOrder: 0,
        },
      });
      const blockExercise = await cleanupRaw.workoutBlockExercise.create({
        data: {
          sectionId: section.id,
          exerciseId: source.id,
          repScheme: "STRAIGHT",
          repValues: [5, 5, 5],
          sets: 3,
          sortOrder: 0,
        },
      });

      toCleanup.push({ table: "workoutBlockExercise", id: blockExercise.id });
      toCleanup.push({ table: "schemeSection", id: section.id });
      toCleanup.push({ table: "workoutBlock", id: block.id });

      const merged = await libraryExerciseAdminApi.merge({
        sourceId: source.id,
        input: { targetExerciseId: target.id },
        reviewerUserId: admin.user.id,
      });

      expect(merged.id).toBe(target.id);

      const sourceRefs = await cleanupRaw.workoutBlockExercise.findMany({
        where: { exerciseId: source.id },
      });

      expect(sourceRefs).toHaveLength(0);

      const targetRefs = await cleanupRaw.workoutBlockExercise.findMany({
        where: { exerciseId: target.id },
      });

      expect(targetRefs).toHaveLength(1);

      const sourceAfter = await cleanupRaw.exercise.findUnique({ where: { id: source.id } });

      expect(sourceAfter?.status).toBe("MERGED");
      expect(sourceAfter?.mergedIntoId).toBe(target.id);
      expect(sourceAfter?.deletedAt).not.toBeNull();
    });

    it("throws ConflictError on self-merge", async () => {
      const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: exercise.id });

      await expect(
        libraryExerciseAdminApi.merge({
          sourceId: exercise.id,
          input: { targetExerciseId: exercise.id },
          reviewerUserId: admin.user.id,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError when target is not APPROVED", async () => {
      const source = await createTestExercise(coach.user.id, { status: "APPROVED" });
      const target = await createTestExercise(coach.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: source.id });
      toCleanup.push({ table: "exercise", id: target.id });

      await expect(
        libraryExerciseAdminApi.merge({
          sourceId: source.id,
          input: { targetExerciseId: target.id },
          reviewerUserId: admin.user.id,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws NotFoundError when source does not exist", async () => {
      const target = await createTestExercise(coach.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: target.id });

      await expect(
        libraryExerciseAdminApi.merge({
          sourceId: "cljsomefakeidnotexisting0",
          input: { targetExerciseId: target.id },
          reviewerUserId: admin.user.id,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("filters by status=PENDING_REVIEW", async () => {
      const pending = await createTestExercise(coach.user.id, {
        status: "PENDING_REVIEW",
        canonicalName: `Pending ${crypto.randomUUID().slice(0, 4)}`,
      });
      const approved = await createTestExercise(coach.user.id, {
        status: "APPROVED",
        canonicalName: `Approved ${crypto.randomUUID().slice(0, 4)}`,
      });

      toCleanup.push({ table: "exercise", id: pending.id });
      toCleanup.push({ table: "exercise", id: approved.id });

      const result = await libraryExerciseAdminApi.list({ status: ExerciseStatus.PENDING_REVIEW });

      const ids = result.items.map((item) => item.id);

      expect(ids).toContain(pending.id);
      expect(ids).not.toContain(approved.id);
    });

    it("returns usageCount=0 for exercises without block references", async () => {
      const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: exercise.id });

      const result = await libraryExerciseAdminApi.list({ createdByUserId: coach.user.id });
      const found = result.items.find((item) => item.id === exercise.id);

      expect(found?.usageCount).toBe(0);
    });
  });
});
