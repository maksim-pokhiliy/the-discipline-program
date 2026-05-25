import { describe, expect, it } from "vitest";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";

import { computeDaySummary } from "./compute-day-summary";

const now = new Date("2025-01-06T00:00:00Z");

const makeLabel = (name: string): Label => ({
  id: `clp9z8x7w0000abcd1234${name.toLowerCase().padEnd(4, "x").slice(0, 4)}`,
  name,
  nameLower: name.toLowerCase(),
  applicableLevels: ["SESSION"],
  notes: null,
  rest: false,
  createdAt: now,
  updatedAt: now,
});

const makeSession = (label: Label | null): SessionWithLabel => ({
  id: "clp9z8x7w0000abcd1234ses1",
  dayId: "clp9z8x7w0000abcd1234day1",
  order: 10,
  labelId: label?.id ?? null,
  notes: null,
  freezeLoadsAtCreation: false,
  createdAt: now,
  updatedAt: now,
  label,
  blocks: [],
});

describe("computeDaySummary", () => {
  it("returns an empty string for an empty sessions list", () => {
    expect(computeDaySummary([])).toBe("");
  });

  it("returns the single label name when one labelled session is present", () => {
    expect(computeDaySummary([makeSession(makeLabel("MAIN"))])).toBe("MAIN");
  });

  it("joins multiple label names with a middle-dot separator", () => {
    const sessions = [makeSession(makeLabel("STRENGTH")), makeSession(makeLabel("METCON"))];

    expect(computeDaySummary(sessions)).toBe("STRENGTH · METCON");
  });

  it("falls back to 1 session for a single unlabelled session", () => {
    expect(computeDaySummary([makeSession(null)])).toBe("1 session");
  });

  it("falls back to N sessions plural when all sessions are unlabelled", () => {
    const sessions = [makeSession(null), makeSession(null), makeSession(null)];

    expect(computeDaySummary(sessions)).toBe("3 sessions");
  });
});
