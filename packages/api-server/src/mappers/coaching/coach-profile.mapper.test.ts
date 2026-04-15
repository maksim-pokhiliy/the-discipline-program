import { describe, expect, it } from "vitest";

import { mapToCoachProfile } from "./coach-profile.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");

const makeCoachProfile = (overrides = {}) => ({
  id: "cls_cp_1",
  userId: "cls_user_2",
  bio: "10 years coaching experience",
  createdAt: NOW,
  updatedAt: LATER,
  deletedAt: null,
  ...overrides,
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
