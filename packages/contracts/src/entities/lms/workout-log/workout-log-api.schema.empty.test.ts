import { describe, expect, it } from "vitest";

import { getWorkoutLogsResponseSchema } from "./workout-log-api.schema";

describe("workout-log-api schema empty payloads", () => {
  it("getWorkoutLogsResponseSchema accepts empty array", () => {
    const result = getWorkoutLogsResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getWorkoutLogsResponseSchema rejects null", () => {
    const result = getWorkoutLogsResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getWorkoutLogsResponseSchema rejects undefined", () => {
    const result = getWorkoutLogsResponseSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("getWorkoutLogsResponseSchema rejects object shape", () => {
    const result = getWorkoutLogsResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
