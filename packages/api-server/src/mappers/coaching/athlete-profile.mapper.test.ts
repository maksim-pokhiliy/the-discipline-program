import { Gender as PrismaGender, HealthStatus as PrismaHealthStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";

import { mapToAthleteProfile } from "./athlete-profile.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");

const makeAthleteProfile = (overrides = {}) => ({
  id: "cls_ap_1",
  userId: "cls_user_1",
  gender: PrismaGender.MALE,
  heightCm: 180,
  weightKg: new Decimal("82.50"),
  healthStatus: PrismaHealthStatus.HEALTHY,
  healthNote: null,
  createdAt: NOW,
  updatedAt: LATER,
  ...overrides,
});

describe("mapToAthleteProfile", () => {
  it("maps all fields with non-null gender", () => {
    const input = makeAthleteProfile();
    const result = mapToAthleteProfile(input);

    expect(result).toEqual({
      id: "cls_ap_1",
      userId: "cls_user_1",
      gender: Gender.MALE,
      heightCm: 180,
      weightKg: 82.5,
      healthStatus: HealthStatus.HEALTHY,
      healthNote: null,
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("maps null gender to null", () => {
    const input = makeAthleteProfile({ gender: null });
    const result = mapToAthleteProfile(input);

    expect(result.gender).toBeNull();
  });

  it("maps FEMALE gender", () => {
    const input = makeAthleteProfile({ gender: PrismaGender.FEMALE });
    const result = mapToAthleteProfile(input);

    expect(result.gender).toBe(Gender.FEMALE);
  });

  it("converts Decimal weightKg to number", () => {
    const input = makeAthleteProfile({ weightKg: new Decimal("95.30") });
    const result = mapToAthleteProfile(input);

    expect(result.weightKg).toBe(95.3);
    expect(typeof result.weightKg).toBe("number");
  });

  it("keeps null weightKg as null", () => {
    const input = makeAthleteProfile({ weightKg: null });
    const result = mapToAthleteProfile(input);

    expect(result.weightKg).toBeNull();
  });

  it("maps INJURED healthStatus", () => {
    const input = makeAthleteProfile({ healthStatus: PrismaHealthStatus.INJURED });
    const result = mapToAthleteProfile(input);

    expect(result.healthStatus).toBe(HealthStatus.INJURED);
  });

  it("maps RESTRICTED healthStatus", () => {
    const input = makeAthleteProfile({ healthStatus: PrismaHealthStatus.RESTRICTED });
    const result = mapToAthleteProfile(input);

    expect(result.healthStatus).toBe(HealthStatus.RESTRICTED);
  });

  it("handles null heightCm", () => {
    const input = makeAthleteProfile({ heightCm: null });
    const result = mapToAthleteProfile(input);

    expect(result.heightCm).toBeNull();
  });

  it("passes healthNote through", () => {
    const input = makeAthleteProfile({ healthNote: "Knee pain after squats" });
    const result = mapToAthleteProfile(input);

    expect(result.healthNote).toBe("Knee pain after squats");
  });
});
