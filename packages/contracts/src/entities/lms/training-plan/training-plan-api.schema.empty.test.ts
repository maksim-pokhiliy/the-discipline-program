import { describe, expect, it } from "vitest";

import {
  coachPlansPageDataSchema,
  copyWeekResponseSchema,
  getCalendarWeekResponseSchema,
  getTrainingPlansResponseSchema,
} from "./training-plan-api.schema";

describe("training-plan-api schema empty payloads", () => {
  it("getTrainingPlansResponseSchema accepts empty array", () => {
    const result = getTrainingPlansResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getTrainingPlansResponseSchema rejects null", () => {
    const result = getTrainingPlansResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("coachPlansPageDataSchema accepts empty plans list", () => {
    const result = coachPlansPageDataSchema.safeParse({ plans: [] });

    expect(result.success).toBe(true);
  });

  it("coachPlansPageDataSchema rejects missing plans key", () => {
    const result = coachPlansPageDataSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("getCalendarWeekResponseSchema accepts empty array", () => {
    const result = getCalendarWeekResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("copyWeekResponseSchema accepts empty array", () => {
    const result = copyWeekResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });
});
