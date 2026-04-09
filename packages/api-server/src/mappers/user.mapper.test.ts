import { Gender as PrismaGender, HealthStatus as PrismaHealthStatus, Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/athlete-profile";
import { UserRole } from "@repo/contracts/auth";

import {
  mapToAdminUser,
  mapToAdminUserListItem,
  mapToAthleteProfile,
  mapToCoachProfile,
} from "./user.mapper";

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

const makeCoachProfile = (overrides = {}) => ({
  id: "cls_cp_1",
  userId: "cls_user_2",
  bio: "10 years coaching experience",
  createdAt: NOW,
  updatedAt: LATER,
  deletedAt: null,
  ...overrides,
});

const makeUser = (overrides = {}) => ({
  id: "cls_user_1",
  email: "john@example.com",
  name: "John Doe",
  role: Role.USER,
  image: "https://example.com/avatar.jpg",
  timezone: "Europe/Kyiv",
  emailVerified: NOW,
  password: "hashed_password",
  createdAt: NOW,
  updatedAt: LATER,
  deletedAt: null,
  athleteProfile: null,
  coachProfile: null,
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

describe("mapToCoachProfile", () => {
  it("maps all fields correctly", () => {
    const input = makeCoachProfile();
    const result = mapToCoachProfile(input);

    expect(result).toEqual({
      id: "cls_cp_1",
      userId: "cls_user_2",
      bio: "10 years coaching experience",
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("handles null bio", () => {
    const input = makeCoachProfile({ bio: null });
    const result = mapToCoachProfile(input);

    expect(result.bio).toBeNull();
  });

  it("excludes deletedAt from output", () => {
    const input = makeCoachProfile({ deletedAt: new Date() });
    const result = mapToCoachProfile(input);

    expect(result).not.toHaveProperty("deletedAt");
  });
});

describe("mapToAdminUser", () => {
  it("maps user without profiles", () => {
    const input = makeUser();
    const result = mapToAdminUser(input);

    expect(result).toEqual({
      id: "cls_user_1",
      email: "john@example.com",
      name: "John Doe",
      role: UserRole.USER,
      image: "https://example.com/avatar.jpg",
      timezone: "Europe/Kyiv",
      emailVerified: NOW,
      createdAt: NOW,
      updatedAt: LATER,
      athleteProfile: null,
      coachProfile: null,
    });
  });

  it("maps user with athlete profile", () => {
    const input = makeUser({ athleteProfile: makeAthleteProfile() });
    const result = mapToAdminUser(input);

    expect(result.athleteProfile).toEqual({
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

  it("maps user with coach profile", () => {
    const input = makeUser({ coachProfile: makeCoachProfile() });
    const result = mapToAdminUser(input);

    expect(result.coachProfile).toEqual({
      id: "cls_cp_1",
      userId: "cls_user_2",
      bio: "10 years coaching experience",
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("maps user with both profiles", () => {
    const input = makeUser({
      athleteProfile: makeAthleteProfile(),
      coachProfile: makeCoachProfile(),
    });
    const result = mapToAdminUser(input);

    expect(result.athleteProfile).not.toBeNull();
    expect(result.coachProfile).not.toBeNull();
  });

  it("maps COACH role", () => {
    const input = makeUser({ role: Role.COACH });
    const result = mapToAdminUser(input);

    expect(result.role).toBe(UserRole.COACH);
  });

  it("maps ADMIN role", () => {
    const input = makeUser({ role: Role.ADMIN });
    const result = mapToAdminUser(input);

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it("handles null name and image", () => {
    const input = makeUser({ name: null, image: null });
    const result = mapToAdminUser(input);

    expect(result.name).toBeNull();
    expect(result.image).toBeNull();
  });

  it("handles null emailVerified", () => {
    const input = makeUser({ emailVerified: null });
    const result = mapToAdminUser(input);

    expect(result.emailVerified).toBeNull();
  });

  it("excludes password and deletedAt from output", () => {
    const input = makeUser();
    const result = mapToAdminUser(input);

    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("deletedAt");
  });
});

describe("mapToAdminUserListItem", () => {
  it("maps all fields correctly", () => {
    const input = makeUser();
    const result = mapToAdminUserListItem(input);

    expect(result).toEqual({
      id: "cls_user_1",
      email: "john@example.com",
      name: "John Doe",
      role: UserRole.USER,
      image: "https://example.com/avatar.jpg",
      timezone: "Europe/Kyiv",
      createdAt: NOW,
    });
  });

  it("maps COACH role", () => {
    const input = makeUser({ role: Role.COACH });
    const result = mapToAdminUserListItem(input);

    expect(result.role).toBe(UserRole.COACH);
  });

  it("maps ADMIN role", () => {
    const input = makeUser({ role: Role.ADMIN });
    const result = mapToAdminUserListItem(input);

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it("excludes updatedAt, password, deletedAt, profiles from output", () => {
    const input = makeUser({
      athleteProfile: makeAthleteProfile(),
      coachProfile: makeCoachProfile(),
    });
    const result = mapToAdminUserListItem(input);

    expect(result).not.toHaveProperty("updatedAt");
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("deletedAt");
    expect(result).not.toHaveProperty("athleteProfile");
    expect(result).not.toHaveProperty("coachProfile");
    expect(result).not.toHaveProperty("emailVerified");
  });
});
