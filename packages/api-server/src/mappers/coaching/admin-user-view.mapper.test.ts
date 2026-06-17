import { Gender as PrismaGender, HealthStatus as PrismaHealthStatus, Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { UserRole } from "@repo/contracts/iam/auth";

import { mapToAdminUserView } from "./admin-user-view.mapper";

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
  profileSelections: null,
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
  role: Role.ATHLETE,
  image: "https://example.com/avatar.jpg",
  timezone: "Europe/Kyiv",
  emailVerified: NOW,
  password: "hashed_password",
  createdAt: NOW,
  updatedAt: LATER,
  tokenVersion: 0,
  deletedAt: null,
  athleteProfile: null,
  coachProfile: null,
  ...overrides,
});

describe("mapToAdminUserView", () => {
  it("maps user without profiles", () => {
    const input = makeUser();
    const result = mapToAdminUserView(input);

    expect(result).toEqual({
      id: "cls_user_1",
      email: "john@example.com",
      name: "John Doe",
      role: UserRole.ATHLETE,
      image: "https://example.com/avatar.jpg",
      timezone: "Europe/Kyiv",
      emailVerified: NOW,
      createdAt: NOW,
      updatedAt: LATER,
      hasPassword: true,
      athleteProfile: null,
      coachProfile: null,
    });
  });

  it("maps user with athlete profile", () => {
    const input = makeUser({ athleteProfile: makeAthleteProfile() });
    const result = mapToAdminUserView(input);

    expect(result.athleteProfile).toEqual({
      id: "cls_ap_1",
      userId: "cls_user_1",
      gender: Gender.MALE,
      heightCm: 180,
      weightKg: 82.5,
      healthStatus: HealthStatus.HEALTHY,
      healthNote: null,
      profileSelections: null,
      createdAt: NOW,
      updatedAt: LATER,
      assignedCoaches: [],
    });
  });

  it("maps assigned coaches when athleteAssignments are provided", () => {
    const input = makeUser({
      athleteProfile: makeAthleteProfile(),
      athleteAssignments: [
        {
          id: "cls_caa_1",
          coachId: "cls_cp_1",
          athleteId: "cls_user_1",
          createdAt: NOW,
          updatedAt: LATER,
          coach: {
            ...makeCoachProfile(),
            user: {
              id: "cls_user_2",
              name: "Coach Jane",
              email: "jane@example.com",
            },
          },
        },
      ],
    });
    const result = mapToAdminUserView(input);

    expect(result.athleteProfile?.assignedCoaches).toEqual([
      {
        id: "cls_cp_1",
        userId: "cls_user_2",
        name: "Coach Jane",
        email: "jane@example.com",
      },
    ]);
  });

  it("maps user with coach profile", () => {
    const input = makeUser({ coachProfile: makeCoachProfile() });
    const result = mapToAdminUserView(input);

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
    const result = mapToAdminUserView(input);

    expect(result.athleteProfile).not.toBeNull();
    expect(result.coachProfile).not.toBeNull();
  });

  it("maps COACH role", () => {
    const input = makeUser({ role: Role.COACH });
    const result = mapToAdminUserView(input);

    expect(result.role).toBe(UserRole.COACH);
  });

  it("maps ADMIN role", () => {
    const input = makeUser({ role: Role.ADMIN });
    const result = mapToAdminUserView(input);

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it("handles null name and image", () => {
    const input = makeUser({ name: null, image: null });
    const result = mapToAdminUserView(input);

    expect(result.name).toBeNull();
    expect(result.image).toBeNull();
  });

  it("handles null emailVerified", () => {
    const input = makeUser({ emailVerified: null });
    const result = mapToAdminUserView(input);

    expect(result.emailVerified).toBeNull();
  });

  it("excludes password and deletedAt from output", () => {
    const input = makeUser();
    const result = mapToAdminUserView(input);

    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("deletedAt");
  });

  it("reports hasPassword false when password is null", () => {
    const input = makeUser({ password: null });
    const result = mapToAdminUserView(input);

    expect(result.hasPassword).toBe(false);
  });

  it("reports hasPassword true when password is set", () => {
    const input = makeUser({ password: "hashed" });
    const result = mapToAdminUserView(input);

    expect(result.hasPassword).toBe(true);
  });

  it("maps an athlete with exactly one assigned coach", () => {
    const input = makeUser({
      athleteProfile: makeAthleteProfile(),
      athleteAssignments: [
        {
          id: "cls_caa_1",
          coachId: "cls_cp_1",
          athleteId: "cls_user_1",
          createdAt: NOW,
          updatedAt: LATER,
          coach: {
            ...makeCoachProfile(),
            user: {
              id: "cls_user_2",
              name: "Coach Jane",
              email: "jane@example.com",
            },
          },
        },
      ],
    });
    const result = mapToAdminUserView(input);

    expect(result.athleteProfile?.assignedCoaches).toHaveLength(1);
    expect(result.athleteProfile?.assignedCoaches[0]).toEqual({
      id: "cls_cp_1",
      userId: "cls_user_2",
      name: "Coach Jane",
      email: "jane@example.com",
    });
  });

  it("preserves the input order of assignedCoaches (mapper does not sort)", () => {
    const input = makeUser({
      athleteProfile: makeAthleteProfile(),
      athleteAssignments: [
        {
          id: "cls_caa_z",
          coachId: "cls_cp_z",
          athleteId: "cls_user_1",
          createdAt: NOW,
          updatedAt: LATER,
          coach: {
            ...makeCoachProfile({ id: "cls_cp_z" }),
            user: { id: "cls_user_z", name: "Zara", email: "zara@example.com" },
          },
        },
        {
          id: "cls_caa_a",
          coachId: "cls_cp_a",
          athleteId: "cls_user_1",
          createdAt: NOW,
          updatedAt: LATER,
          coach: {
            ...makeCoachProfile({ id: "cls_cp_a" }),
            user: { id: "cls_user_a", name: "Adam", email: "adam@example.com" },
          },
        },
        {
          id: "cls_caa_m",
          coachId: "cls_cp_m",
          athleteId: "cls_user_1",
          createdAt: NOW,
          updatedAt: LATER,
          coach: {
            ...makeCoachProfile({ id: "cls_cp_m" }),
            user: { id: "cls_user_m", name: "Mia", email: "mia@example.com" },
          },
        },
      ],
    });
    const result = mapToAdminUserView(input);

    expect(result.athleteProfile?.assignedCoaches.map((c) => c.name)).toEqual([
      "Zara",
      "Adam",
      "Mia",
    ]);
  });

  it("keeps athleteProfile null when input has no profile and does not leak assignedCoaches", () => {
    const input = makeUser({
      athleteProfile: null,
      athleteAssignments: [
        {
          id: "cls_caa_orphan",
          coachId: "cls_cp_orphan",
          athleteId: "cls_user_1",
          createdAt: NOW,
          updatedAt: LATER,
          coach: {
            ...makeCoachProfile(),
            user: { id: "cls_user_2", name: "Coach Jane", email: "jane@example.com" },
          },
        },
      ],
    });
    const result = mapToAdminUserView(input);

    expect(result.athleteProfile).toBeNull();
    expect(result).not.toHaveProperty("assignedCoaches");
  });
});
