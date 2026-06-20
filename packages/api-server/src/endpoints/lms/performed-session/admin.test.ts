import { DayOfWeek, EnrollmentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createPerformedSessionRequestSchema,
  PERFORMED_SESSION_CONSTANTS,
} from "@repo/contracts/lms/performed-session";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanup, cleanupRaw, createTestPlan, createTestUser } from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestBenchmarkSchema,
  createTestEnrollment,
  createTestScheduleScenario,
} from "../../../test/schedule-helpers";

import { lmsPerformedSessionApi } from "./admin";

describe("lmsPerformedSessionApi", () => {
  let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;
  let enrolledSessionId: string;

  let unenrolledAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let sessionInUnenrolledPlanId: string;

  const extraCleanup: CleanupEntry[] = [];

  beforeAll(async () => {
    scenario = await createTestScheduleScenario({
      tz: "UTC",
      weeksBack: 0,
      sessionsPerWeek: 1,
    });

    const firstSession = scenario.sessions[0];

    if (!firstSession) {
      throw new Error("schedule scenario produced no session");
    }

    enrolledSessionId = firstSession.sessionId;

    unenrolledAthlete = await createTestUser();
    extraCleanup.push({ table: "user", id: unenrolledAthlete.id });

    const unenrolledPlan = await createTestPlan(scenario.coach.user.id, { status: "ACTIVE" });

    extraCleanup.push({ table: "trainingPlan", id: unenrolledPlan.id });

    const benchmark = await createTestBenchmarkSchema(unenrolledPlan.id, { resultType: "time" });

    sessionInUnenrolledPlanId = benchmark.session.id;
    extraCleanup.push(...benchmark.toCleanup);
  });

  afterAll(async () => {
    await cleanup(...extraCleanup);
    await cleanup(...scenario.toCleanup);
  });

  describe("create", () => {
    it("persists a tick for a reachable session (QA-004)", async () => {
      const performed = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-02-01T00:00:00.000Z"),
      });

      try {
        expect(performed.sessionId).toBe(enrolledSessionId);
        expect(performed.userId).toBe(scenario.athlete.id);
        expect(performed.performedAt.getTime()).toBe(
          new Date("2026-02-01T00:00:00.000Z").getTime(),
        );
      } finally {
        await cleanup({ table: "performedSession", id: performed.id });
      }
    });

    it("creates two rows when the same session is logged twice (unbounded, D-LAYERS)", async () => {
      const first = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-02-01T00:00:00.000Z"),
      });
      const second = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-02-08T00:00:00.000Z"),
      });

      try {
        expect(second.id).not.toBe(first.id);
        expect(first.sessionId).toBe(enrolledSessionId);
        expect(second.sessionId).toBe(enrolledSessionId);
      } finally {
        await cleanup(
          { table: "performedSession", id: second.id },
          { table: "performedSession", id: first.id },
        );
      }
    });

    it("rejects logging a session in a plan the athlete is not enrolled in (QA-004)", async () => {
      await expect(
        lmsPerformedSessionApi.create(unenrolledAthlete.id, {
          sessionId: enrolledSessionId,
          performedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects logging a session whose plan the athlete has no enrollment in (QA-004)", async () => {
      await expect(
        lmsPerformedSessionApi.create(scenario.athlete.id, {
          sessionId: sessionInUnenrolledPlanId,
          performedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects logging a session before a hidden boarding week, matching the read guard (SMELL-015)", async () => {
      const boardedAthlete = await createTestUser();
      const boardedPlan = await createTestPlan(scenario.coach.user.id, { status: "ACTIVE" });
      const boardedEnrollment = await createTestEnrollment(
        boardedPlan.id,
        boardedAthlete.id,
        scenario.coach.user.id,
        { status: EnrollmentStatus.ACTIVE, boardedAt: new Date("2026-07-06T00:00:00.000Z") },
      );

      await prisma.planEnrollment.update({
        where: { id: boardedEnrollment.enrollment.id },
        data: { hidePastBeforeBoarding: true },
      });

      const preBoardingWeek = await cleanupRaw.week.create({
        data: { planId: boardedPlan.id, startDate: new Date("2026-06-15T00:00:00.000Z") },
      });
      const preBoardingDay = await cleanupRaw.day.create({
        data: { weekId: preBoardingWeek.id, dayOfWeek: DayOfWeek.MONDAY },
      });
      const preBoardingSession = await cleanupRaw.session.create({
        data: { dayId: preBoardingDay.id, order: 0 },
      });

      try {
        await expect(
          lmsPerformedSessionApi.create(boardedAthlete.id, {
            sessionId: preBoardingSession.id,
            performedAt: new Date("2026-06-15T00:00:00.000Z"),
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await cleanup(
          { table: "session", id: preBoardingSession.id },
          { table: "day", id: preBoardingDay.id },
          { table: "week", id: preBoardingWeek.id },
          ...boardedEnrollment.toCleanup,
          { table: "trainingPlan", id: boardedPlan.id },
          { table: "user", id: boardedAthlete.id },
        );
      }
    });

    it("persists a tick for an on-boarding session under a hidden boarding enrollment (SMELL-015)", async () => {
      const boardedAthlete = await createTestUser();
      const boardedPlan = await createTestPlan(scenario.coach.user.id, { status: "ACTIVE" });
      const boardedEnrollment = await createTestEnrollment(
        boardedPlan.id,
        boardedAthlete.id,
        scenario.coach.user.id,
        { status: EnrollmentStatus.ACTIVE, boardedAt: new Date("2026-06-15T00:00:00.000Z") },
      );

      await prisma.planEnrollment.update({
        where: { id: boardedEnrollment.enrollment.id },
        data: { hidePastBeforeBoarding: true },
      });

      const boardingWeek = await cleanupRaw.week.create({
        data: { planId: boardedPlan.id, startDate: new Date("2026-06-15T00:00:00.000Z") },
      });
      const boardingDay = await cleanupRaw.day.create({
        data: { weekId: boardingWeek.id, dayOfWeek: DayOfWeek.MONDAY },
      });
      const boardingSession = await cleanupRaw.session.create({
        data: { dayId: boardingDay.id, order: 0 },
      });

      let performedId: string | null = null;

      try {
        const performed = await lmsPerformedSessionApi.create(boardedAthlete.id, {
          sessionId: boardingSession.id,
          performedAt: new Date("2026-06-15T00:00:00.000Z"),
        });

        performedId = performed.id;
        expect(performed.sessionId).toBe(boardingSession.id);
        expect(performed.userId).toBe(boardedAthlete.id);
      } finally {
        await cleanup(
          ...(performedId === null ? [] : [{ table: "performedSession", id: performedId }]),
          { table: "session", id: boardingSession.id },
          { table: "day", id: boardingDay.id },
          { table: "week", id: boardingWeek.id },
          ...boardedEnrollment.toCleanup,
          { table: "trainingPlan", id: boardedPlan.id },
          { table: "user", id: boardedAthlete.id },
        );
      }
    });
  });

  describe("createPerformedSessionRequestSchema", () => {
    it("rejects athleteNotes longer than MAX_NOTE_LENGTH (QA-017)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: enrolledSessionId,
        performedAt: "2026-02-01T00:00:00.000Z",
        athleteNotes: "a".repeat(PERFORMED_SESSION_CONSTANTS.MAX_NOTE_LENGTH + 1),
      });

      expect(result.success).toBe(false);
    });

    it("accepts athleteNotes at exactly MAX_NOTE_LENGTH (QA-017)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: enrolledSessionId,
        performedAt: "2026-02-01T00:00:00.000Z",
        athleteNotes: "a".repeat(PERFORMED_SESSION_CONSTANTS.MAX_NOTE_LENGTH),
      });

      expect(result.success).toBe(true);
    });

    it("rejects duplicate plannedSchemaId values in results (QA-001)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: "clz000000000000000000sess1",
        performedAt: "2026-02-01T00:00:00.000Z",
        results: [
          { plannedSchemaId: "clz000000000000000000sch1", result: { type: "time", seconds: 540 } },
          { plannedSchemaId: "clz000000000000000000sch1", result: { type: "time", seconds: 600 } },
        ],
      });

      expect(result.success).toBe(false);
    });

    it("accepts distinct plannedSchemaId values in results (QA-001)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: "clz000000000000000000sess1",
        performedAt: "2026-02-01T00:00:00.000Z",
        results: [
          { plannedSchemaId: "clz000000000000000000sch1", result: { type: "time", seconds: 540 } },
          { plannedSchemaId: "clz000000000000000000sch2", result: { type: "time", seconds: 600 } },
        ],
      });

      expect(result.success).toBe(true);
    });
  });
});
