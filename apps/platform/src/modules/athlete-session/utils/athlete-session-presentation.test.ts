import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import {
  type ResolvedLoad,
  type RowView,
  type SessionHeaderView,
} from "@repo/contracts/lms/session-detail";
import { theme } from "@repo/mui";

import {
  buildRowSubLine,
  formatCompletedDate,
  formatSessionDate,
  resolveCardDecoration,
  resolveLoadCell,
} from "./athlete-session-presentation";

const baseRow = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: "clz0000000000000000000row1",
  movement: "Back Squat",
  media: null,
  sets: null,
  reps: null,
  load: null,
  resolvedLoad: null,
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
  ...overrides,
});

const baseHeader = (overrides: Partial<SessionHeaderView> = {}): SessionHeaderView => ({
  sessionId: "clz000000000000000000sess1",
  planTitle: "Performance RX",
  position: "Week 3 · Day 4 · Performance RX",
  title: "Heavy Back Squat",
  dayOfWeek: "THURSDAY",
  dayOfMonth: 18,
  summary: "6 blocks · 1 benchmark",
  done: false,
  completedAt: null,
  ...overrides,
});

describe("resolveCardDecoration", () => {
  it("borders a benchmark card with the success tint", () => {
    const decoration = resolveCardDecoration(true, theme);

    expect(decoration.borderColor).not.toBe(theme.palette.divider);
  });

  it("borders an ordinary card with the divider color", () => {
    const decoration = resolveCardDecoration(false, theme);

    expect(decoration.borderColor).toBe(theme.palette.divider);
  });
});

describe("resolveLoadCell", () => {
  it("returns empty when there is no resolved load", () => {
    expect(resolveLoadCell(null, null)).toEqual({ state: "empty" });
  });

  it("renders a resolved absolute load as kg with no sub", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 40, perHand: false };
    const load: Load = { kind: "absolute", count: 1, kg: 40 };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "resolved",
      value: "40 kg",
      sub: null,
    });
  });

  it("renders a per-hand resolved load with the per-hand sub", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 24, perHand: true };
    const load: Load = { kind: "absolute", count: 2, kg: 24 };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "resolved",
      value: "24 kg",
      sub: "24 kg / hand",
    });
  });

  it("surfaces the percentage value in the sub of a resolved percentage load", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 80, perHand: false };
    const load: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "resolved",
      value: "80 kg",
      sub: "80%",
    });
  });

  it("surfaces a percentage range in the sub when rangeMax is set", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 80, perHand: false };
    const load: Load = {
      kind: "percentage",
      value: 70,
      rangeMax: 80,
      reference: { scope: "self" },
    };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "resolved",
      value: "80 kg",
      sub: "70–80%",
    });
  });

  it("renders bodyweight for a not_applicable load", () => {
    const resolved: ResolvedLoad = { status: "not_applicable" };

    expect(resolveLoadCell(resolved, { kind: "bodyweight" })).toEqual({ state: "bodyweight" });
  });

  it("renders the set-1RM prompt with the percentage hint for missing_one_rm", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: "clz000000000000000000ex01",
    };
    const load: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "missing_one_rm",
      exerciseId: "clz000000000000000000ex01",
      hint: "80% of 1RM",
    });
  });

  it("renders the pick-profile prompt with the axes hint for missing_profile_pick", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisNames: ["Level", "Sex"],
    };
    const load: Load = {
      kind: "byProfile",
      axes: [
        { name: "Level", values: ["RX", "Scaled"] },
        { name: "Sex", values: ["M", "F"] },
      ],
      cells: [
        { coords: ["RX", "M"], kg: 60 },
        { coords: ["RX", "F"], kg: 42 },
        { coords: ["Scaled", "M"], kg: 45 },
        { coords: ["Scaled", "F"], kg: 30 },
      ],
    };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "missing_profile_pick",
      hint: "RX/Scaled · M/F",
    });
  });

  it("falls back to the server axisNames when the raw load is not byProfile", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisNames: ["Level", "Sex"],
    };

    expect(resolveLoadCell(resolved, null)).toEqual({
      state: "missing_profile_pick",
      hint: "Level · Sex",
    });
  });
});

describe("buildRowSubLine", () => {
  it("joins tempo, side, intensity and modifiers with the dot separator", () => {
    const row = baseRow({
      tempo: { eccentric: 3, pauseBottom: 0, concentric: "X", pauseTop: 1 },
      side: { kind: "each_leg" },
      intensity: { effortPercent: { value: 70 } },
      modifiers: ["tempo", "paused"],
    });

    expect(buildRowSubLine(row)).toBe("3-0-X-1  ·  each leg  ·  70% effort  ·  tempo, paused");
  });

  it("returns an empty string when no sub-line dimension is present", () => {
    expect(buildRowSubLine(baseRow())).toBe("");
  });

  it("omits absent dimensions", () => {
    const row = baseRow({ intensity: { rpe: { value: 8 } } });

    expect(buildRowSubLine(row)).toBe("RPE 8");
  });
});

describe("date formatters", () => {
  it("renders the session date as weekday plus day-of-month from the enum (tz-stable)", () => {
    expect(formatSessionDate(baseHeader())).toBe("Thursday 18");
  });

  it("renders the same parts regardless of how the header is constructed", () => {
    const sunday = baseHeader({ dayOfWeek: "SUNDAY", dayOfMonth: 1 });

    expect(formatSessionDate(sunday)).toBe("Sunday 1");
  });

  it("renders the completed date in UTC", () => {
    expect(formatCompletedDate(new Date("2026-06-18T12:00:00.000Z"))).toBe("Logged June 18");
  });
});
