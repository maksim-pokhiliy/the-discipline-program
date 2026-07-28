import { describe, expect, it } from "vitest";

import { createMobileLinkRequestSchema } from "./mobile-link-api.schema";
import { createMobileLinkSchema, mobileLinkSchema } from "./mobile-link.schema";

const PLAN_ID = "clp9z8x7w0001abcd1234efgh";
const ATHLETE_ID = "clp9z8x7w0002abcd1234efgh";

const baseEntity = {
  id: "clp9z8x7w0000abcd1234efgh",
  planId: PLAN_ID,
  channel: "GENERAL" as const,
  legacyLevelId: 7,
  legacyUserId: null,
  athleteId: null,
  publishedDayCount: 0,
  lastPublishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("mobileLinkSchema", () => {
  it("accepts a full valid GENERAL link", () => {
    const result = mobileLinkSchema.safeParse(baseEntity);

    expect(result.success).toBe(true);
  });

  it("accepts an INDIVIDUAL link with a null legacyLevelId and a resolved athlete", () => {
    const result = mobileLinkSchema.safeParse({
      ...baseEntity,
      channel: "INDIVIDUAL",
      legacyLevelId: null,
      legacyUserId: 5,
      athleteId: ATHLETE_ID,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown channel", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, channel: "PRIVATE" });

    expect(result.success).toBe(false);
  });

  it("rejects a non-integer legacyLevelId", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, legacyLevelId: 7.5 });

    expect(result.success).toBe(false);
  });
});

describe("createMobileLinkSchema", () => {
  it("accepts a valid GENERAL create payload", () => {
    const result = createMobileLinkSchema.safeParse({ planId: PLAN_ID, legacyLevelId: 7 });

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid planId", () => {
    const result = createMobileLinkSchema.safeParse({ planId: "nope", legacyLevelId: 7 });

    expect(result.success).toBe(false);
  });
});

describe("createMobileLinkRequestSchema", () => {
  it("accepts the channel-less GENERAL arm", () => {
    const result = createMobileLinkRequestSchema.safeParse({ planId: PLAN_ID, legacyLevelId: 7 });

    expect(result.success).toBe(true);
  });

  it("accepts the INDIVIDUAL arm with channel, athleteId and legacyUserId", () => {
    const result = createMobileLinkRequestSchema.safeParse({
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: ATHLETE_ID,
      legacyUserId: 5,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an INDIVIDUAL request missing athleteId and legacyUserId", () => {
    const result = createMobileLinkRequestSchema.safeParse({
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
    });

    expect(result.success).toBe(false);
  });

  it("strips a stray legacyLevelId from a valid INDIVIDUAL request", () => {
    const result = createMobileLinkRequestSchema.safeParse({
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: ATHLETE_ID,
      legacyUserId: 5,
      legacyLevelId: 9,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("legacyLevelId");
    }
  });

  it("falls through to a GENERAL link when channel is INDIVIDUAL but the individual fields are absent (QA-03)", () => {
    const result = createMobileLinkRequestSchema.safeParse({
      planId: PLAN_ID,
      legacyLevelId: 7,
      channel: "INDIVIDUAL",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("channel");
    }
  });
});
