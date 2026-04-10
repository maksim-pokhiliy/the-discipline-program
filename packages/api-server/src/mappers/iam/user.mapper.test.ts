import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { mapToAdminUserListItem, mapToUser } from "./user.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");

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
  ...overrides,
});

describe("mapToUser", () => {
  it("maps all fields from a Prisma user", () => {
    const input = makeUser();
    const result = mapToUser(input);

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
    });
  });

  it("maps COACH role", () => {
    const input = makeUser({ role: Role.COACH });
    const result = mapToUser(input);

    expect(result.role).toBe(UserRole.COACH);
  });

  it("maps ADMIN role", () => {
    const input = makeUser({ role: Role.ADMIN });
    const result = mapToUser(input);

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it("handles null name, image, and emailVerified", () => {
    const input = makeUser({ name: null, image: null, emailVerified: null });
    const result = mapToUser(input);

    expect(result.name).toBeNull();
    expect(result.image).toBeNull();
    expect(result.emailVerified).toBeNull();
  });

  it("excludes password and deletedAt from output", () => {
    const input = makeUser();
    const result = mapToUser(input);

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

  it("excludes updatedAt, password, deletedAt, emailVerified from output", () => {
    const input = makeUser();
    const result = mapToAdminUserListItem(input);

    expect(result).not.toHaveProperty("updatedAt");
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("deletedAt");
    expect(result).not.toHaveProperty("emailVerified");
  });
});
