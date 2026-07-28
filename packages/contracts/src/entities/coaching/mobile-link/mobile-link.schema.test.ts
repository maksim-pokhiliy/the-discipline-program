import { describe, expect, it } from "vitest";

import { createMobileLinkRequestSchema, getMobileLinksQuerySchema } from "./mobile-link-api.schema";
import { createMobileLinkSchema, mobileLinkSchema } from "./mobile-link.schema";

const PLAN_ID = "clp9z8x7w0001abcd1234efgh";
const ATHLETE_ID = "clp9z8x7w0002abcd1234efgh";
const PUBLISHED_AT = new Date("2026-01-08T09:30:00.000Z");
const WEEK_PUBLISHED_AT = new Date("2026-01-09T18:00:00.000Z");

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

const individualEntity = {
  ...baseEntity,
  channel: "INDIVIDUAL" as const,
  legacyLevelId: null,
  legacyUserId: 5,
  athleteId: ATHLETE_ID,
};

describe("mobileLinkSchema", () => {
  it("accepts a full valid GENERAL link", () => {
    const result = mobileLinkSchema.safeParse(baseEntity);

    expect(result.success).toBe(true);
  });

  it("accepts an INDIVIDUAL link with a null legacyLevelId and a resolved athlete", () => {
    const result = mobileLinkSchema.safeParse(individualEntity);

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

describe("mobileLinkSchema publish aggregate", () => {
  const publishedFields = { publishedDayCount: 12, lastPublishedAt: PUBLISHED_AT };
  const weekPublish = { publishedDayCount: 3, lastPublishedAt: WEEK_PUBLISHED_AT };

  it("carries a real lifetime aggregate on the GENERAL arm", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, ...publishedFields });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.publishedDayCount).toBe(publishedFields.publishedDayCount);
      expect(result.data.lastPublishedAt).toEqual(PUBLISHED_AT);
    }
  });

  it("carries a real lifetime aggregate on the INDIVIDUAL arm", () => {
    const result = mobileLinkSchema.safeParse({ ...individualEntity, ...publishedFields });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.publishedDayCount).toBe(publishedFields.publishedDayCount);
      expect(result.data.lastPublishedAt).toEqual(PUBLISHED_AT);
    }
  });

  it("carries an optional week aggregate on both arms when it is supplied", () => {
    const general = mobileLinkSchema.safeParse({ ...baseEntity, weekPublish });
    const individual = mobileLinkSchema.safeParse({ ...individualEntity, weekPublish });

    expect(general.success).toBe(true);
    expect(individual.success).toBe(true);

    if (general.success && individual.success) {
      expect(general.data.weekPublish).toEqual(weekPublish);
      expect(individual.data.weekPublish).toEqual(weekPublish);
    }
  });

  it("leaves weekPublish off the parsed link entirely when it is not supplied", () => {
    const result = mobileLinkSchema.safeParse(baseEntity);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(Object.keys(result.data)).not.toContain("weekPublish");
    }
  });

  it("rejects a negative publishedDayCount", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, publishedDayCount: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects a link that carries no publishedDayCount at all", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, publishedDayCount: undefined });

    expect(result.success).toBe(false);
  });

  it("rejects an ISO string in place of the lastPublishedAt instant", () => {
    const result = mobileLinkSchema.safeParse({
      ...baseEntity,
      publishedDayCount: 1,
      lastPublishedAt: PUBLISHED_AT.toISOString(),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a week aggregate missing its own lastPublishedAt", () => {
    const result = mobileLinkSchema.safeParse({
      ...baseEntity,
      weekPublish: { publishedDayCount: 3 },
    });

    expect(result.success).toBe(false);
  });
});

describe("getMobileLinksQuerySchema", () => {
  it("accepts a planId with no weekStart", () => {
    const result = getMobileLinksQuerySchema.safeParse({ planId: PLAN_ID });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.weekStart).toBeUndefined();
    }
  });

  it("accepts a YYYY-MM-DD weekStart", () => {
    const result = getMobileLinksQuerySchema.safeParse({
      planId: PLAN_ID,
      weekStart: "2026-01-05",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.weekStart).toBe("2026-01-05");
    }
  });

  it("rejects a weekStart that is not a zero-padded calendar date", () => {
    const result = getMobileLinksQuerySchema.safeParse({ planId: PLAN_ID, weekStart: "2026-1-5" });

    expect(result.success).toBe(false);
  });

  it("rejects a weekStart carrying a time component", () => {
    const result = getMobileLinksQuerySchema.safeParse({
      planId: PLAN_ID,
      weekStart: "2026-01-05T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid planId", () => {
    const result = getMobileLinksQuerySchema.safeParse({ planId: "nope" });

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
