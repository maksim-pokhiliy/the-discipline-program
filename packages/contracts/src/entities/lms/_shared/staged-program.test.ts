import { describe, expect, it } from "vitest";

import { stageSchema, stagedProgramSchema } from "./staged-program";

describe("stageSchema", () => {
  it("accepts reps as plain int", () => {
    expect(stageSchema.safeParse({ reps: 5 }).success).toBe(true);
  });

  it("accepts reps as RepNotation count", () => {
    expect(stageSchema.safeParse({ reps: { kind: "count", value: 8 } }).success).toBe(true);
  });

  it("accepts optional load", () => {
    expect(
      stageSchema.safeParse({
        reps: 5,
        load: { kind: "absolute", weight: { variant: "single", valueKg: 20 } },
      }).success,
    ).toBe(true);
  });

  it("accepts optional indicator explode", () => {
    expect(stageSchema.safeParse({ reps: 5, indicator: "explode" }).success).toBe(true);
  });

  it("accepts optional indicator without_weight", () => {
    expect(stageSchema.safeParse({ reps: 5, indicator: "without_weight" }).success).toBe(true);
  });

  it("rejects label with empty string", () => {
    expect(stageSchema.safeParse({ reps: 5, label: "" }).success).toBe(false);
  });

  it("accepts optional media reference", () => {
    expect(
      stageSchema.safeParse({
        reps: 5,
        media: {
          url: "https://example.com/v.mp4",
          position: "inline",
          appliesTo: "current_row",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects zero reps", () => {
    expect(stageSchema.safeParse({ reps: 0 }).success).toBe(false);
  });
});

describe("stagedProgramSchema", () => {
  it("accepts drop_set with single stage", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "drop_set",
        stages: [{ reps: 10 }],
      }).success,
    ).toBe(true);
  });

  it("accepts wave kind", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "wave",
        stages: [{ reps: 5 }, { reps: 3 }, { reps: 1 }],
      }).success,
    ).toBe(true);
  });

  it("accepts cluster with setsCount + stageCountPerSet", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "cluster",
        stages: [{ reps: 2 }],
        setsCount: 5,
        stageCountPerSet: 3,
      }).success,
    ).toBe(true);
  });

  it("rejects cluster missing setsCount", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "cluster",
        stages: [{ reps: 2 }],
        stageCountPerSet: 3,
      }).success,
    ).toBe(false);
  });

  it("rejects cluster missing stageCountPerSet", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "cluster",
        stages: [{ reps: 2 }],
        setsCount: 5,
      }).success,
    ).toBe(false);
  });

  it("rejects empty stages array", () => {
    expect(stagedProgramSchema.safeParse({ programKind: "drop_set", stages: [] }).success).toBe(
      false,
    );
  });

  it("accepts optional separatorForm literal", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "drop_set",
        stages: [{ reps: 5 }],
        separatorForm: "...then...",
      }).success,
    ).toBe(true);
  });

  it("accepts mediaPerStage record with string keys", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "drop_set",
        stages: [{ reps: 5 }],
        mediaPerStage: {
          "0": {
            url: "https://example.com/v.mp4",
            position: "inline",
            appliesTo: "drop_stage",
          },
        },
      }).success,
    ).toBe(true);
  });

  it("accepts optional restBetweenStages", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "drop_set",
        stages: [{ reps: 5 }],
        restBetweenStages: {
          duration: { value: 30, unit: "sec" },
          scope: "between_sets",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects unknown programKind", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "ramp",
        stages: [{ reps: 5 }],
      }).success,
    ).toBe(false);
  });

  it("rejects stage with negative reps", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "drop_set",
        stages: [{ reps: -1 }],
      }).success,
    ).toBe(false);
  });

  it("rejects separatorForm with unexpected literal", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "drop_set",
        stages: [{ reps: 5 }],
        separatorForm: "and-then",
      }).success,
    ).toBe(false);
  });

  it("accepts cluster with both setsCount and stageCountPerSet", () => {
    expect(
      stagedProgramSchema.safeParse({
        programKind: "cluster",
        stages: [{ reps: 2 }, { reps: 2 }],
        setsCount: 4,
        stageCountPerSet: 2,
        restBetweenStages: {
          duration: { value: 15, unit: "sec" },
          scope: "between_intervals",
        },
      }).success,
    ).toBe(true);
  });
});
