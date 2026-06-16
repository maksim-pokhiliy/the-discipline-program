import { describe, expect, it } from "vitest";

import { COACH_NOTE_CONSTANTS } from "../coach-note";

import { resolveActionItemRequestSchema } from "./coach-action-item-api.schema";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "./coach-action-item.constants";
import {
  actionItemResolveReasonSchema,
  actionItemSeveritySchema,
  actionItemStatusSchema,
  actionItemTypeSchema,
  coachActionItemSchema,
  healthReportMetadataSchema,
  missedWorkoutsMetadataSchema,
} from "./coach-action-item.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";
const VALID_CUID_3 = "clz00000000000000000fake3";
const NOW = new Date();

describe("coachActionItemSchema", () => {
  it("accepts a full valid object", () => {
    const result = coachActionItemSchema.safeParse({
      id: VALID_CUID,
      coachId: VALID_CUID_2,
      athleteId: VALID_CUID_3,
      type: ActionItemType.MISSED_WORKOUTS,
      severity: ActionItemSeverity.WARNING,
      status: ActionItemStatus.OPEN,
      message: "Athlete missed 3 workouts",
      metadata: { lastActivityDate: "2025-12-01" },
      resolvedAt: null,
      resolveReason: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(result.success).toBe(true);
  });

  it("accepts resolved item with resolvedAt and resolveReason", () => {
    const result = coachActionItemSchema.safeParse({
      id: VALID_CUID,
      coachId: VALID_CUID_2,
      athleteId: VALID_CUID_3,
      type: ActionItemType.HEALTH_REPORT,
      severity: ActionItemSeverity.CRITICAL,
      status: ActionItemStatus.RESOLVED,
      message: "Athlete reported injury",
      metadata: null,
      resolvedAt: NOW,
      resolveReason: ActionItemResolveReason.MANUAL_CONTACTED,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(result.success).toBe(true);
  });

  it("accepts metadata as a record with unknown values", () => {
    const result = coachActionItemSchema.safeParse({
      id: VALID_CUID,
      coachId: VALID_CUID_2,
      athleteId: VALID_CUID_3,
      type: ActionItemType.HEALTH_REPORT,
      severity: ActionItemSeverity.INFO,
      status: ActionItemStatus.OPEN,
      message: "Health report filed",
      metadata: { healthStatus: "injured", details: 42, nested: { a: 1 } },
      resolvedAt: null,
      resolveReason: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid type enum", () => {
    const result = coachActionItemSchema.safeParse({
      id: VALID_CUID,
      coachId: VALID_CUID_2,
      athleteId: VALID_CUID_3,
      type: "INVALID_TYPE",
      severity: ActionItemSeverity.INFO,
      status: ActionItemStatus.OPEN,
      message: "Test",
      metadata: null,
      resolvedAt: null,
      resolveReason: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = coachActionItemSchema.safeParse({
      id: VALID_CUID,
      coachId: VALID_CUID_2,
    });

    expect(result.success).toBe(false);
  });
});

describe("missedWorkoutsMetadataSchema", () => {
  it("accepts valid metadata", () => {
    const result = missedWorkoutsMetadataSchema.safeParse({
      lastActivityDate: "2025-11-15",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing lastActivityDate", () => {
    const result = missedWorkoutsMetadataSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects non-string lastActivityDate", () => {
    const result = missedWorkoutsMetadataSchema.safeParse({
      lastActivityDate: 12345,
    });

    expect(result.success).toBe(false);
  });
});

describe("healthReportMetadataSchema", () => {
  it("accepts valid metadata", () => {
    const result = healthReportMetadataSchema.safeParse({
      healthStatus: "injured",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing healthStatus", () => {
    const result = healthReportMetadataSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects non-string healthStatus", () => {
    const result = healthReportMetadataSchema.safeParse({
      healthStatus: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("actionItemTypeSchema", () => {
  it.each(Object.values(ActionItemType))("accepts valid type: %s", (value) => {
    expect(actionItemTypeSchema.safeParse(value).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(actionItemTypeSchema.safeParse("UNKNOWN").success).toBe(false);
  });
});

describe("actionItemSeveritySchema", () => {
  it.each(Object.values(ActionItemSeverity))("accepts valid severity: %s", (value) => {
    expect(actionItemSeveritySchema.safeParse(value).success).toBe(true);
  });

  it("rejects invalid severity", () => {
    expect(actionItemSeveritySchema.safeParse("EXTREME").success).toBe(false);
  });
});

describe("actionItemStatusSchema", () => {
  it.each(Object.values(ActionItemStatus))("accepts valid status: %s", (value) => {
    expect(actionItemStatusSchema.safeParse(value).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(actionItemStatusSchema.safeParse("PENDING").success).toBe(false);
  });
});

describe("actionItemResolveReasonSchema", () => {
  it.each(Object.values(ActionItemResolveReason))("accepts valid reason: %s", (value) => {
    expect(actionItemResolveReasonSchema.safeParse(value).success).toBe(true);
  });

  it("rejects invalid reason", () => {
    expect(actionItemResolveReasonSchema.safeParse("MAGIC").success).toBe(false);
  });
});

describe("resolveActionItemRequestSchema", () => {
  it("accepts an empty body as the back-compat default", () => {
    expect(resolveActionItemRequestSchema.safeParse({}).success).toBe(true);
  });

  it("accepts the manual reason with a note", () => {
    const result = resolveActionItemRequestSchema.safeParse({
      reason: ActionItemResolveReason.MANUAL_CONTACTED,
      note: "Reached out via email",
    });

    expect(result.success).toBe(true);
  });

  it("accepts only a note without a reason", () => {
    expect(resolveActionItemRequestSchema.safeParse({ note: "Called the athlete" }).success).toBe(
      true,
    );
  });

  it("accepts only the manual reason without a note", () => {
    expect(
      resolveActionItemRequestSchema.safeParse({
        reason: ActionItemResolveReason.MANUAL_CONTACTED,
      }).success,
    ).toBe(true);
  });

  it("rejects an auto reason", () => {
    expect(
      resolveActionItemRequestSchema.safeParse({
        reason: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
      }).success,
    ).toBe(false);
  });

  it("rejects the other auto reason", () => {
    expect(
      resolveActionItemRequestSchema.safeParse({
        reason: ActionItemResolveReason.AUTO_ASSIGNMENT_ENDED,
      }).success,
    ).toBe(false);
  });

  it("rejects an empty note", () => {
    expect(resolveActionItemRequestSchema.safeParse({ note: "" }).success).toBe(false);
  });

  it("rejects a note over the max length", () => {
    const note = "a".repeat(COACH_NOTE_CONSTANTS.MAX_CONTENT_LENGTH + 1);

    expect(resolveActionItemRequestSchema.safeParse({ note }).success).toBe(false);
  });

  it("accepts a note at the max length", () => {
    const note = "a".repeat(COACH_NOTE_CONSTANTS.MAX_CONTENT_LENGTH);

    expect(resolveActionItemRequestSchema.safeParse({ note }).success).toBe(true);
  });
});
