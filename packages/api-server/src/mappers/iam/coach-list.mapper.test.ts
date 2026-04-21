import { describe, expect, it } from "vitest";

import { mapToCoachListItem, type CoachListRow } from "./coach-list.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");

const makeRow = (overrides: Partial<CoachListRow> = {}): CoachListRow => ({
  id: "cls_cp_1",
  userId: "cls_user_1",
  bio: "10 years coaching experience",
  createdAt: NOW,
  updatedAt: LATER,
  deletedAt: null,
  user: {
    id: "cls_user_1",
    name: "Coach Jane",
    email: "jane@example.com",
  },
  ...overrides,
});

describe("mapToCoachListItem", () => {
  it("maps a normal coach profile with user name and email", () => {
    const row = makeRow();
    const result = mapToCoachListItem(row);

    expect(result).toEqual({
      id: "cls_cp_1",
      userId: "cls_user_1",
      name: "Coach Jane",
      email: "jane@example.com",
    });
  });

  it("maps a coach with null name (name stays null in output)", () => {
    const row = makeRow({
      user: { id: "cls_user_1", name: null, email: "anon@example.com" },
    });
    const result = mapToCoachListItem(row);

    expect(result.name).toBeNull();
    expect(result.email).toBe("anon@example.com");
  });

  it("returns exactly the four contract fields with the correct shape", () => {
    const row = makeRow();
    const result = mapToCoachListItem(row);

    expect(Object.keys(result).sort()).toEqual(["email", "id", "name", "userId"]);
    expect(typeof result.id).toBe("string");
    expect(typeof result.userId).toBe("string");
    expect(typeof result.email).toBe("string");
    expect(result).not.toHaveProperty("bio");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("deletedAt");
  });
});
