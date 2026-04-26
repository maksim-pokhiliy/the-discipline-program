import { describe, expect, it } from "vitest";

import { prescriptionSchema } from "./prescription.schema";

describe("prescriptionSchema — at-least-one refine", () => {
  it("rejects an empty prescription", () => {
    const result = prescriptionSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepts only reps", () => {
    const value = prescriptionSchema.parse({ reps: { kind: "FIXED", value: 10 } });

    expect(value.reps).toEqual({ kind: "FIXED", value: 10 });
    expect(value.sideMode).toBe("BILATERAL");
    expect(value.modifiers).toEqual([]);
  });

  it("accepts only durationSec", () => {
    expect(prescriptionSchema.parse({ durationSec: 60 }).durationSec).toBe(60);
  });

  it("accepts only distanceM", () => {
    expect(prescriptionSchema.parse({ distanceM: 400 }).distanceM).toBe(400);
  });

  it("accepts only calories", () => {
    expect(prescriptionSchema.parse({ calories: 12 }).calories).toBe(12);
  });

  it("accepts only composition", () => {
    const value = prescriptionSchema.parse({
      composition: [{ exerciseId: "ckxxxxxxxxxxxxxxxxxxxxxxx", reps: 1 }],
    });

    expect(value.composition).toHaveLength(1);
  });

  it("rejects only load (load alone is not a metric)", () => {
    const result = prescriptionSchema.safeParse({
      load: { kind: "BARBELL", kg: 60 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects only tempo without any quantitative metric", () => {
    const result = prescriptionSchema.safeParse({
      tempo: { tempoString: "2-1-X-1" },
    });

    expect(result.success).toBe(false);
  });

  it("accepts reps with a load and tempo", () => {
    const value = prescriptionSchema.parse({
      reps: { kind: "FIXED", value: 5 },
      load: { kind: "BARBELL", kg: 100 },
      tempo: { pauseUpSec: 1, pauseDownSec: 2 },
      sideMode: "BILATERAL",
    });

    expect(value.reps).toEqual({ kind: "FIXED", value: 5 });
    expect(value.load).toEqual({ kind: "BARBELL", kg: 100 });
  });

  it("rejects scalingNotes longer than 500 chars", () => {
    const result = prescriptionSchema.safeParse({
      reps: { kind: "FIXED", value: 1 },
      scalingNotes: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("defaults sideMode to BILATERAL when omitted", () => {
    const value = prescriptionSchema.parse({ reps: { kind: "FIXED", value: 1 } });

    expect(value.sideMode).toBe("BILATERAL");
  });

  it("respects explicit sideMode", () => {
    const value = prescriptionSchema.parse({
      reps: { kind: "EACH_SIDE", value: 8 },
      sideMode: "EACH_ARM",
    });

    expect(value.sideMode).toBe("EACH_ARM");
  });
});
