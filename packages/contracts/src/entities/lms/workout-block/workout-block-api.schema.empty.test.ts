import { describe, expect, it } from "vitest";

import { getWorkoutBlocksResponseSchema } from "./workout-block-api.schema";

describe("workout-block-api schema empty payloads", () => {
  it("getWorkoutBlocksResponseSchema accepts empty array", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getWorkoutBlocksResponseSchema rejects null", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getWorkoutBlocksResponseSchema rejects undefined", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("getWorkoutBlocksResponseSchema rejects object shape", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
