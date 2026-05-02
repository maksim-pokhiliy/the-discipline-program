import { describe, expect, it } from "vitest";

import { buildCreateDay } from "./build-create-day";

const VALID_CUID_WEEK = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildCreateDay — emits create-day op", () => {
  it("returns create-day op with only dayOfWeek when kind and notes are omitted", () => {
    const op = buildCreateDay({ weekId: VALID_CUID_WEEK, dayOfWeek: "MON" });

    expect(op).toEqual({
      kind: "create-day",
      weekId: VALID_CUID_WEEK,
      payload: { dayOfWeek: "MON" },
    });
  });

  it("includes kind override when provided", () => {
    const op = buildCreateDay({ weekId: VALID_CUID_WEEK, dayOfWeek: "SUN", kind: "REST" });

    expect(op).toEqual({
      kind: "create-day",
      weekId: VALID_CUID_WEEK,
      payload: { dayOfWeek: "SUN", kind: "REST" },
    });
  });

  it("includes notes when provided alongside kind", () => {
    const op = buildCreateDay({
      weekId: VALID_CUID_WEEK,
      dayOfWeek: "WED",
      kind: "TRAINING",
      notes: "Heavy day",
    });

    expect(op).toEqual({
      kind: "create-day",
      weekId: VALID_CUID_WEEK,
      payload: { dayOfWeek: "WED", kind: "TRAINING", notes: "Heavy day" },
    });
  });
});
