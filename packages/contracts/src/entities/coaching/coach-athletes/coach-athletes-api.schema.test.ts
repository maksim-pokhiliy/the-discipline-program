import { describe, expect, it } from "vitest";

import { EnrollmentStatus } from "../../lms/plan-enrollment";
import { Gender, HealthStatus } from "../athlete-profile";
import { ProcessStatus, TodayStatus } from "../coach-dashboard";

import { coachAthleteDetailSchema, last7DaySchema } from "./coach-athletes-api.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";
const NOW = new Date();

const buildLast7Days = () =>
  Array.from({ length: 7 }, () => ({ date: NOW, status: TodayStatus.COMPLETED }));

const buildDetailBase = () => ({
  userId: VALID_CUID,
  name: "Jane Doe",
  email: "jane@example.com",
  image: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  gender: Gender.FEMALE,
  heightCm: 168,
  weightKg: 62,
  processStatus: ProcessStatus.ON_TRACK,
  enrollments: [
    {
      planId: VALID_CUID_2,
      planName: "Strength Base",
      status: EnrollmentStatus.ACTIVE,
      boardedAt: NOW,
    },
  ],
  notes: [{ id: VALID_CUID_2, content: "Watch the left knee", createdAt: NOW }],
  planDiscipline: [
    {
      planId: VALID_CUID_2,
      planName: "Strength Base",
      enrolledDate: NOW,
      completed: 2,
      available: 3,
      planned: 4,
    },
  ],
  recentWorkouts: [
    { id: VALID_CUID_2, title: "Heavy Squats", date: NOW, planName: "Strength Base" },
  ],
  actionItems: [],
  nextWorkout: { title: "Deadlifts", date: NOW, planName: "Strength Base" },
  consistency: { adherenceRate4w: 0.8, currentStreak: 3, missedThisWeek: 1 },
  enrolledSince: NOW,
  lastActivityDate: NOW,
  daysSinceLastActivity: 0,
});

const buildDetail = () => ({
  ...buildDetailBase(),
  last7Days: buildLast7Days(),
  currentWeek: 1,
  totalWeeks: 8,
  todayStatus: TodayStatus.PENDING,
  todayWorkoutTitle: "Deadlifts",
});

describe("last7DaySchema", () => {
  it("accepts a valid day entry", () => {
    expect(last7DaySchema.safeParse({ date: NOW, status: TodayStatus.COMPLETED }).success).toBe(
      true,
    );
  });

  it.each(Object.values(TodayStatus))("accepts status: %s", (status) => {
    expect(last7DaySchema.safeParse({ date: NOW, status }).success).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(last7DaySchema.safeParse({ date: NOW, status: "DONE" }).success).toBe(false);
  });

  it("rejects a non-date date", () => {
    expect(
      last7DaySchema.safeParse({ date: "2025-01-01", status: TodayStatus.COMPLETED }).success,
    ).toBe(false);
  });
});

describe("coachAthleteDetailSchema", () => {
  it("accepts a full valid object with the new fields", () => {
    expect(coachAthleteDetailSchema.safeParse(buildDetail()).success).toBe(true);
  });

  it("accepts currentWeek null and totalWeeks zero", () => {
    const result = coachAthleteDetailSchema.safeParse({
      ...buildDetail(),
      currentWeek: null,
      totalWeeks: 0,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a null todayWorkoutTitle", () => {
    expect(
      coachAthleteDetailSchema.safeParse({ ...buildDetail(), todayWorkoutTitle: null }).success,
    ).toBe(true);
  });

  it("rejects the old shape that omits the new fields", () => {
    expect(coachAthleteDetailSchema.safeParse(buildDetailBase()).success).toBe(false);
  });

  it("rejects a non-array last7Days", () => {
    expect(coachAthleteDetailSchema.safeParse({ ...buildDetail(), last7Days: null }).success).toBe(
      false,
    );
  });

  it("rejects a zero currentWeek", () => {
    expect(coachAthleteDetailSchema.safeParse({ ...buildDetail(), currentWeek: 0 }).success).toBe(
      false,
    );
  });

  it("rejects a non-integer totalWeeks", () => {
    expect(coachAthleteDetailSchema.safeParse({ ...buildDetail(), totalWeeks: 1.5 }).success).toBe(
      false,
    );
  });

  it("rejects an invalid todayStatus", () => {
    expect(
      coachAthleteDetailSchema.safeParse({ ...buildDetail(), todayStatus: "DONE" }).success,
    ).toBe(false);
  });
});
