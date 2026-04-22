import { describe, expect, it } from "vitest";

import { UserRole } from "../../iam/auth";

import {
  createCoachInviteRequestSchema,
  createCoachInviteResponseSchema,
} from "./coach-invite-api.schema";

describe("coach-invite-api schema empty payloads", () => {
  it("createCoachInviteRequestSchema rejects empty object", () => {
    const result = createCoachInviteRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("createCoachInviteRequestSchema accepts email only and defaults name to null", () => {
    const result = createCoachInviteRequestSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.name).toBeNull();
    }
  });

  it("createCoachInviteRequestSchema trims and lowercases email", () => {
    const result = createCoachInviteRequestSchema.safeParse({
      email: "  USER@EXAMPLE.COM  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("createCoachInviteRequestSchema rejects invalid email", () => {
    const result = createCoachInviteRequestSchema.safeParse({
      email: "invalid",
    });

    expect(result.success).toBe(false);
  });

  it("createCoachInviteRequestSchema rejects empty name string", () => {
    const result = createCoachInviteRequestSchema.safeParse({
      email: "u@e.com",
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("createCoachInviteRequestSchema rejects name longer than 120 chars", () => {
    const result = createCoachInviteRequestSchema.safeParse({
      email: "u@e.com",
      name: "A".repeat(121),
    });

    expect(result.success).toBe(false);
  });

  it("createCoachInviteResponseSchema accepts a valid user shape", () => {
    const now = new Date();
    const result = createCoachInviteResponseSchema.safeParse({
      id: "clx000000000000000000000",
      email: "athlete@example.com",
      name: "New Athlete",
      role: UserRole.ATHLETE,
      image: null,
      timezone: "UTC",
      emailVerified: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(result.success).toBe(true);
  });
});
