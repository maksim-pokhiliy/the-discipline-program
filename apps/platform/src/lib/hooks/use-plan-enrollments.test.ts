import { describe, expect, it } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";

import { applyEnrollmentUpdate } from "./use-plan-enrollments";

const baseEntry: PlanRosterEntry = {
  id: "ckxw5p7gp0000q1mnzv5cuq0a",
  planId: "ckxw5p7gp0000q1mnzv5cuq0b",
  userId: "ckxw5p7gp0000q1mnzv5cuq0c",
  startedAtWeekIndex: 0,
  startedOnDate: new Date("2026-01-01T00:00:00.000Z"),
  status: PlanEnrollmentStatus.ACTIVE,
  endedOnDate: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  user: {
    id: "ckxw5p7gp0000q1mnzv5cuq0c",
    name: "Athlete",
    email: "athlete@example.com",
    image: null,
    healthStatus: HealthStatus.HEALTHY,
  },
};

describe("applyEnrollmentUpdate", () => {
  it("preserves status when payload omits the field", () => {
    const next = applyEnrollmentUpdate(baseEntry, { endedOnDate: new Date("2026-02-01") });

    expect(next.status).toBe(PlanEnrollmentStatus.ACTIVE);
    expect(next.endedOnDate).toEqual(new Date("2026-02-01"));
  });

  it("preserves status when payload sets status to undefined", () => {
    const payload = { status: undefined, endedOnDate: new Date("2026-02-01") };
    const next = applyEnrollmentUpdate(baseEntry, payload);

    expect(next.status).toBe(PlanEnrollmentStatus.ACTIVE);
    expect(next.endedOnDate).toEqual(new Date("2026-02-01"));
  });

  it("preserves endedOnDate when payload omits the field", () => {
    const next = applyEnrollmentUpdate(
      { ...baseEntry, endedOnDate: new Date("2026-03-01") },
      { status: PlanEnrollmentStatus.PAUSED },
    );

    expect(next.endedOnDate).toEqual(new Date("2026-03-01"));
    expect(next.status).toBe(PlanEnrollmentStatus.PAUSED);
  });

  it("applies a defined endedOnDate of null (explicit clear)", () => {
    const next = applyEnrollmentUpdate(
      { ...baseEntry, endedOnDate: new Date("2026-03-01") },
      { endedOnDate: null },
    );

    expect(next.endedOnDate).toBeNull();
  });

  it("applies a defined status update", () => {
    const next = applyEnrollmentUpdate(baseEntry, { status: PlanEnrollmentStatus.COMPLETED });

    expect(next.status).toBe(PlanEnrollmentStatus.COMPLETED);
    expect(next.endedOnDate).toBeNull();
  });

  it("returns a fresh object instead of mutating the source", () => {
    const next = applyEnrollmentUpdate(baseEntry, { status: PlanEnrollmentStatus.PAUSED });

    expect(next).not.toBe(baseEntry);
    expect(baseEntry.status).toBe(PlanEnrollmentStatus.ACTIVE);
  });
});
