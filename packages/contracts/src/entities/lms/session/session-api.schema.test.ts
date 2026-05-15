import { describe, expect, it } from "vitest";

import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  reorderSessionsRequestSchema,
  reorderSessionsResponseSchema,
  sessionByDayParamsSchema,
  sessionByIdParamsSchema,
  updateSessionRequestSchema,
  updateSessionResponseSchema,
} from "./session-api.schema";
import {
  createSessionSchema,
  reorderSessionsSchema,
  sessionSchema,
  updateSessionSchema,
} from "./session.schema";

const planId = "clz1234567890123456789012";
const sessionId = "clz1234567890123456789aaa";

describe("sessionByDayParamsSchema", () => {
  it("accepts a fully-populated valid object", () => {
    const result = sessionByDayParamsSchema.safeParse({
      planId,
      startDate: "2026-05-15",
      dayOfWeek: "MONDAY",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a lowercase dayOfWeek", () => {
    const result = sessionByDayParamsSchema.safeParse({
      planId,
      startDate: "2026-05-15",
      dayOfWeek: "monday",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a null dayOfWeek", () => {
    const result = sessionByDayParamsSchema.safeParse({
      planId,
      startDate: "2026-05-15",
      dayOfWeek: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a startDate without leading zeros", () => {
    const result = sessionByDayParamsSchema.safeParse({
      planId,
      startDate: "2026-5-15",
      dayOfWeek: "MONDAY",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid planId", () => {
    const result = sessionByDayParamsSchema.safeParse({
      planId: "not-a-cuid",
      startDate: "2026-05-15",
      dayOfWeek: "MONDAY",
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionByIdParamsSchema", () => {
  it("accepts two cuids", () => {
    const result = sessionByIdParamsSchema.safeParse({ planId, sessionId });

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid sessionId", () => {
    const result = sessionByIdParamsSchema.safeParse({
      planId,
      sessionId: "not-a-cuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing sessionId", () => {
    const result = sessionByIdParamsSchema.safeParse({ planId });

    expect(result.success).toBe(false);
  });
});

describe("request/response wrapper aliases", () => {
  it("createSessionRequestSchema is createSessionSchema", () => {
    expect(createSessionRequestSchema).toBe(createSessionSchema);
  });

  it("createSessionResponseSchema is sessionSchema", () => {
    expect(createSessionResponseSchema).toBe(sessionSchema);
  });

  it("updateSessionRequestSchema is updateSessionSchema", () => {
    expect(updateSessionRequestSchema).toBe(updateSessionSchema);
  });

  it("updateSessionResponseSchema is sessionSchema", () => {
    expect(updateSessionResponseSchema).toBe(sessionSchema);
  });

  it("reorderSessionsRequestSchema is reorderSessionsSchema", () => {
    expect(reorderSessionsRequestSchema).toBe(reorderSessionsSchema);
  });
});

describe("reorderSessionsResponseSchema", () => {
  it("accepts a wrapper { sessions: [] }", () => {
    const result = reorderSessionsResponseSchema.safeParse({ sessions: [] });

    expect(result.success).toBe(true);
  });

  it("rejects a bare array", () => {
    const result = reorderSessionsResponseSchema.safeParse([]);

    expect(result.success).toBe(false);
  });
});
