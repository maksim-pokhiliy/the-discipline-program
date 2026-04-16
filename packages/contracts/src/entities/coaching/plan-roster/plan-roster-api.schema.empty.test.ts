import { describe, expect, it } from "vitest";

import { getPlanRosterResponseSchema } from "./plan-roster-api.schema";

describe("plan-roster-api schema empty payloads", () => {
  it("getPlanRosterResponseSchema accepts empty array", () => {
    const result = getPlanRosterResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getPlanRosterResponseSchema rejects null", () => {
    const result = getPlanRosterResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getPlanRosterResponseSchema rejects undefined", () => {
    const result = getPlanRosterResponseSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("getPlanRosterResponseSchema rejects object shape", () => {
    const result = getPlanRosterResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
