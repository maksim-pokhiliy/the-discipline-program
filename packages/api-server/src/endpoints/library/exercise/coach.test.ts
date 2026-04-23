import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ExerciseStatus, MeasurementUnit } from "@repo/contracts/library/exercise";
import { ConflictError, ForbiddenError } from "@repo/errors";

import { cleanup, createTestCoach } from "../../../test/helpers";
import { createTestExercise } from "../../../test/library-helpers";

import { libraryExerciseCoachApi } from "./coach";

const toCleanup: { table: string; id: string }[] = [];

describe("libraryExerciseCoachApi", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;

  beforeEach(async () => {
    coachA = await createTestCoach();
    coachB = await createTestCoach();

    toCleanup.push(
      { table: "coachProfile", id: coachA.profile.id },
      { table: "user", id: coachA.user.id },
      { table: "coachProfile", id: coachB.profile.id },
      { table: "user", id: coachB.user.id },
    );
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("create", () => {
    it("creates a new exercise in PENDING_REVIEW", async () => {
      const unique = crypto.randomUUID().slice(0, 8);

      const created = await libraryExerciseCoachApi.create({
        userId: coachA.user.id,
        input: {
          canonicalName: `Coach Exercise ${unique}`,
          aliases: [],
          measurementUnits: [MeasurementUnit.REPS],
          hasLoad: false,
        },
      });

      toCleanup.push({ table: "exercise", id: created.id });

      expect(created.status).toBe(ExerciseStatus.PENDING_REVIEW);
      expect(created.createdByUserId).toBe(coachA.user.id);
      expect(created.reviewedAt).toBeNull();
    });

    it("rejects with ConflictError when normalized name matches an APPROVED", async () => {
      const unique = crypto.randomUUID().slice(0, 8);
      const canonical = `Back Squat ${unique}`;
      const approved = await createTestExercise(coachA.user.id, {
        status: "APPROVED",
        canonicalName: canonical,
        normalizedName: canonical.toLowerCase(),
      });

      toCleanup.push({ table: "exercise", id: approved.id });

      await expect(
        libraryExerciseCoachApi.create({
          userId: coachB.user.id,
          input: {
            canonicalName: `  ${canonical}  `,
            aliases: [],
            measurementUnits: [MeasurementUnit.REPS],
            hasLoad: false,
          },
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("list visibility", () => {
    it("excludes other coaches' drafts", async () => {
      const draftB = await createTestExercise(coachB.user.id, {
        status: "PENDING_REVIEW",
        canonicalName: `Secret ${crypto.randomUUID().slice(0, 8)}`,
      });

      toCleanup.push({ table: "exercise", id: draftB.id });

      const result = await libraryExerciseCoachApi.list({
        userId: coachA.user.id,
      });
      const ids = result.items.map((row) => row.id);

      expect(ids).not.toContain(draftB.id);
    });

    it("includes caller's own drafts when includeOwnDrafts is true", async () => {
      const unique = crypto.randomUUID().slice(0, 8);
      const draft = await createTestExercise(coachA.user.id, {
        status: "PENDING_REVIEW",
        canonicalName: `Draft ${unique}`,
        normalizedName: `draft ${unique}`,
      });

      toCleanup.push({ table: "exercise", id: draft.id });

      const result = await libraryExerciseCoachApi.list({
        userId: coachA.user.id,
        includeOwnDrafts: true,
      });
      const ids = result.items.map((row) => row.id);

      expect(ids).toContain(draft.id);
    });

    it("does not include caller's own drafts by default", async () => {
      const unique = crypto.randomUUID().slice(0, 8);
      const draft = await createTestExercise(coachA.user.id, {
        status: "PENDING_REVIEW",
        canonicalName: `Draft ${unique}`,
        normalizedName: `draft ${unique}`,
      });

      toCleanup.push({ table: "exercise", id: draft.id });

      const result = await libraryExerciseCoachApi.list({ userId: coachA.user.id });
      const ids = result.items.map((row) => row.id);

      expect(ids).not.toContain(draft.id);
    });
  });

  describe("update", () => {
    it("throws ForbiddenError when updating another coach's pending exercise", async () => {
      const exerciseOfB = await createTestExercise(coachB.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: exerciseOfB.id });

      await expect(
        libraryExerciseCoachApi.update({
          userId: coachA.user.id,
          id: exerciseOfB.id,
          input: { canonicalName: "Hacked" },
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ConflictError when updating own APPROVED exercise", async () => {
      const own = await createTestExercise(coachA.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: own.id });

      await expect(
        libraryExerciseCoachApi.update({
          userId: coachA.user.id,
          id: own.id,
          input: { canonicalName: "New name" },
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("allows updating own PENDING exercise", async () => {
      const own = await createTestExercise(coachA.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: own.id });

      const updated = await libraryExerciseCoachApi.update({
        userId: coachA.user.id,
        id: own.id,
        input: { canonicalName: `Renamed ${crypto.randomUUID().slice(0, 8)}` },
      });

      expect(updated.canonicalName).toMatch(/^Renamed/);
    });
  });

  describe("delete", () => {
    it("throws ForbiddenError when deleting another coach's exercise", async () => {
      const exerciseOfB = await createTestExercise(coachB.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: exerciseOfB.id });

      await expect(
        libraryExerciseCoachApi.delete({ userId: coachA.user.id, id: exerciseOfB.id }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ConflictError when deleting own APPROVED", async () => {
      const own = await createTestExercise(coachA.user.id, { status: "APPROVED" });

      toCleanup.push({ table: "exercise", id: own.id });

      await expect(
        libraryExerciseCoachApi.delete({ userId: coachA.user.id, id: own.id }),
      ).rejects.toThrow(ConflictError);
    });

    it("soft-deletes own PENDING exercise", async () => {
      const own = await createTestExercise(coachA.user.id, { status: "PENDING_REVIEW" });

      toCleanup.push({ table: "exercise", id: own.id });

      await libraryExerciseCoachApi.delete({ userId: coachA.user.id, id: own.id });

      const after = await libraryExerciseCoachApi.list({
        userId: coachA.user.id,
        includeOwnDrafts: true,
      });

      expect(after.items.map((item) => item.id)).not.toContain(own.id);
    });
  });
});
