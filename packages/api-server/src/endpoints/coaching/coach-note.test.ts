import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestUser,
} from "../../test/helpers";

import { coachingCoachNoteApi } from "./coach-note";

describe("coachingCoachNoteApi", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let unrelatedUser: Awaited<ReturnType<typeof createTestUser>>;
  let planA: Awaited<ReturnType<typeof createTestPlan>>;
  let planB: Awaited<ReturnType<typeof createTestPlan>>;
  let enrollmentAId: string;
  let enrollmentBId: string;
  let assignmentAId: string;
  let assignmentBId: string;

  beforeAll(async () => {
    coachA = await createTestCoach();
    coachB = await createTestCoach();
    athlete = await createTestUser();
    unrelatedUser = await createTestUser();

    planA = await createTestPlan(coachA.profile.id);
    planB = await createTestPlan(coachB.profile.id);

    const enrollmentA = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: planA.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    enrollmentAId = enrollmentA.id;

    const enrollmentB = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: planB.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    enrollmentBId = enrollmentB.id;

    const assignmentA = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coachA.profile.id, athleteId: athlete.id },
    });

    assignmentAId = assignmentA.id;

    const assignmentB = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coachB.profile.id, athleteId: athlete.id },
    });

    assignmentBId = assignmentB.id;
  });

  afterAll(async () => {
    await cleanupRaw.coachNote
      .deleteMany({ where: { coachId: { in: [coachA.profile.id, coachB.profile.id] } } })
      .catch(() => {});

    await cleanup(
      { table: "coachAthleteAssignment", id: assignmentAId },
      { table: "coachAthleteAssignment", id: assignmentBId },
      { table: "planEnrollment", id: enrollmentAId },
      { table: "planEnrollment", id: enrollmentBId },
      { table: "trainingPlan", id: planA.id },
      { table: "trainingPlan", id: planB.id },
      { table: "coachProfile", id: coachA.profile.id },
      { table: "coachProfile", id: coachB.profile.id },
      { table: "user", id: coachA.user.id },
      { table: "user", id: coachB.user.id },
      { table: "user", id: athlete.id },
      { table: "user", id: unrelatedUser.id },
    );
  });

  describe("create", () => {
    it("creates a note for an assigned athlete", async () => {
      const note = await coachingCoachNoteApi.create(coachA.user.id, {
        athleteId: athlete.id,
        content: "Great progress this week",
      });

      expect(note.id).toBeDefined();
      expect(note.coachId).toBe(coachA.profile.id);
      expect(note.athleteId).toBe(athlete.id);
      expect(note.content).toBe("Great progress this week");
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it("throws ForbiddenError when athlete does not belong to coach", async () => {
      await expect(
        coachingCoachNoteApi.create(coachA.user.id, {
          athleteId: unrelatedUser.id,
          content: "Should fail",
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getAll", () => {
    it("returns all notes for the coach", async () => {
      const notes = await coachingCoachNoteApi.getAll(coachA.user.id);

      expect(notes.length).toBeGreaterThanOrEqual(1);
      expect(notes.every((n) => n.coachId === coachA.profile.id)).toBe(true);
    });

    it("does not return notes from another coach (coach isolation)", async () => {
      await coachingCoachNoteApi.create(coachB.user.id, {
        athleteId: athlete.id,
        content: "Coach B private note",
      });

      const notesA = await coachingCoachNoteApi.getAll(coachA.user.id);
      const notesB = await coachingCoachNoteApi.getAll(coachB.user.id);

      expect(notesA.every((n) => n.coachId === coachA.profile.id)).toBe(true);
      expect(notesB.every((n) => n.coachId === coachB.profile.id)).toBe(true);
      expect(notesA.some((n) => n.content === "Coach B private note")).toBe(false);
    });
  });

  describe("getById", () => {
    it("returns a note by id for its owner", async () => {
      const created = await coachingCoachNoteApi.create(coachA.user.id, {
        athleteId: athlete.id,
        content: "Specific note for getById",
      });

      const fetched = await coachingCoachNoteApi.getById(coachA.user.id, created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toBe("Specific note for getById");
    });

    it("throws NotFoundError when coach tries to access another coach's note", async () => {
      const coachBNote = await coachingCoachNoteApi.create(coachB.user.id, {
        athleteId: athlete.id,
        content: "Coach B secret",
      });

      await expect(coachingCoachNoteApi.getById(coachA.user.id, coachBNote.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError for non-existent note", async () => {
      await expect(
        coachingCoachNoteApi.getById(coachA.user.id, "cl000000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    it("updates content of own note", async () => {
      const created = await coachingCoachNoteApi.create(coachA.user.id, {
        athleteId: athlete.id,
        content: "Original content",
      });

      const updated = await coachingCoachNoteApi.update(coachA.user.id, created.id, {
        content: "Updated content",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.content).toBe("Updated content");
    });

    it("throws NotFoundError when updating another coach's note", async () => {
      const coachBNote = await coachingCoachNoteApi.create(coachB.user.id, {
        athleteId: athlete.id,
        content: "Coach B note to update",
      });

      await expect(
        coachingCoachNoteApi.update(coachA.user.id, coachBNote.id, {
          content: "Hijacked",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("deletes own note", async () => {
      const created = await coachingCoachNoteApi.create(coachA.user.id, {
        athleteId: athlete.id,
        content: "To be deleted",
      });

      await coachingCoachNoteApi.delete(coachA.user.id, created.id);

      await expect(coachingCoachNoteApi.getById(coachA.user.id, created.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when deleting another coach's note", async () => {
      const coachBNote = await coachingCoachNoteApi.create(coachB.user.id, {
        athleteId: athlete.id,
        content: "Coach B note to delete",
      });

      await expect(coachingCoachNoteApi.delete(coachA.user.id, coachBNote.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
