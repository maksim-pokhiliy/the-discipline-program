import { describe, expect, it } from "vitest";

import { getWorkoutsResponseSchema } from "./workout-api.schema";

describe("workout-api schema empty payloads", () => {
  it("getWorkoutsResponseSchema accepts empty array", () => {
    const result = getWorkoutsResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getWorkoutsResponseSchema rejects null", () => {
    const result = getWorkoutsResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getWorkoutsResponseSchema rejects undefined", () => {
    const result = getWorkoutsResponseSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("getWorkoutsResponseSchema rejects object shape", () => {
    const result = getWorkoutsResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
