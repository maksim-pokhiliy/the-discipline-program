import { describe, expect, it } from "vitest";

import {
  MOBILE_PUBLISH_ACTIONS,
  MOBILE_PUBLISH_DAY_OF_WEEK_REQUIRED_MESSAGE,
  publishDayResultSchema,
  publishMobileSchema,
} from "./mobile-publish.schema";

const baseWeekInput = {
  linkId: "clp9z8x7w0000abcd1234efgh",
  startDate: "2026-06-22",
  scope: "week" as const,
};

describe("publishMobileSchema", () => {
  it("accepts a week-scope payload without dayOfWeek", () => {
    const result = publishMobileSchema.safeParse(baseWeekInput);

    expect(result.success).toBe(true);
  });

  it("defaults overwriteUnowned to false", () => {
    const result = publishMobileSchema.safeParse(baseWeekInput);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.overwriteUnowned).toBe(false);
    }
  });

  it("accepts a day-scope payload with dayOfWeek", () => {
    const result = publishMobileSchema.safeParse({
      ...baseWeekInput,
      scope: "day",
      dayOfWeek: "MONDAY",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a day-scope payload without dayOfWeek", () => {
    const result = publishMobileSchema.safeParse({ ...baseWeekInput, scope: "day" });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues[0];

      expect(issue?.message).toBe(MOBILE_PUBLISH_DAY_OF_WEEK_REQUIRED_MESSAGE);
      expect(issue?.path).toContain("dayOfWeek");
    }
  });

  it("rejects an unknown scope", () => {
    const result = publishMobileSchema.safeParse({ ...baseWeekInput, scope: "month" });

    expect(result.success).toBe(false);
  });

  it("rejects a startDate that is not YYYY-MM-DD", () => {
    const result = publishMobileSchema.safeParse({ ...baseWeekInput, startDate: "06/22/2026" });

    expect(result.success).toBe(false);
  });
});

describe("publishDayResultSchema", () => {
  it("accepts every MOBILE_PUBLISH_ACTIONS value", () => {
    for (const action of MOBILE_PUBLISH_ACTIONS) {
      const result = publishDayResultSchema.safeParse({
        scheduledDate: "2026-06-22",
        action,
        legacyRowId: 99,
      });

      expect(result.success).toBe(true);
    }
  });

  it("accepts a null legacyRowId", () => {
    const result = publishDayResultSchema.safeParse({
      scheduledDate: "2026-06-22",
      action: "conflict",
      legacyRowId: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown action", () => {
    const result = publishDayResultSchema.safeParse({
      scheduledDate: "2026-06-22",
      action: "deleted",
      legacyRowId: null,
    });

    expect(result.success).toBe(false);
  });
});
