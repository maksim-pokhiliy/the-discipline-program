import { describe, expect, it } from "vitest";

import { type Prescription } from "@repo/contracts/lms/_domain";

import { formatPrescriptionSummary } from "./prescription-summary";

const buildPrescription = (overrides: Partial<Prescription>): Prescription => ({
  sideMode: "BILATERAL",
  modifiers: [],
  ...overrides,
});

describe("formatPrescriptionSummary", () => {
  it("returns an empty string when no fields and default sideMode are set", () => {
    expect(formatPrescriptionSummary(buildPrescription({}))).toBe("");
  });

  it("renders a FIXED RepSpec as the bare value", () => {
    const prescription = buildPrescription({ reps: { kind: "FIXED", value: 5 } });

    expect(formatPrescriptionSummary(prescription)).toBe("5");
  });

  it("renders a RANGE RepSpec as min-max", () => {
    const prescription = buildPrescription({ reps: { kind: "RANGE", min: 3, max: 5 } });

    expect(formatPrescriptionSummary(prescription)).toBe("3-5");
  });

  it("renders an EACH_SIDE RepSpec with the per-side suffix", () => {
    const prescription = buildPrescription({ reps: { kind: "EACH_SIDE", value: 8 } });

    expect(formatPrescriptionSummary(prescription)).toBe("8/side");
  });

  it("renders an AMRAP_REPS RepSpec as the AMRAP literal", () => {
    const prescription = buildPrescription({ reps: { kind: "AMRAP_REPS" } });

    expect(formatPrescriptionSummary(prescription)).toBe("AMRAP");
  });

  it("renders a MAX RepSpec as the max literal", () => {
    const prescription = buildPrescription({ reps: { kind: "MAX" } });

    expect(formatPrescriptionSummary(prescription)).toBe("max");
  });

  it("formats durationSec as MM:SS", () => {
    const prescription = buildPrescription({ durationSec: 90 });

    expect(formatPrescriptionSummary(prescription)).toBe("1:30");
  });

  it("appends the m suffix to distanceM", () => {
    const prescription = buildPrescription({ distanceM: 5000 });

    expect(formatPrescriptionSummary(prescription)).toBe("5000 m");
  });

  it("appends the cal suffix to calories", () => {
    const prescription = buildPrescription({ calories: 12 });

    expect(formatPrescriptionSummary(prescription)).toBe("12 cal");
  });

  it("omits the load segment when LoadSpec kind is NONE", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 5 },
      load: { kind: "NONE" },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("5");
  });

  it("renders a SINGLE_DB load with the SD prefix", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 10 },
      load: { kind: "SINGLE_DB", kg: 22.5 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("10 • SD 22.5kg");
  });

  it("renders a DOUBLE_DB load with the DD prefix and per-hand notation", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 10 },
      load: { kind: "DOUBLE_DB", kgEach: 20 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("10 • DD 2×20kg");
  });

  it("renders a KB load with the KB prefix", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 21 },
      load: { kind: "KB", kg: 24 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("21 • KB 24kg");
  });

  it("renders a BARBELL load with the BB prefix", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 5 },
      load: { kind: "BARBELL", kg: 100 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("5 • BB 100kg");
  });

  it("renders an RX_SCALED load with both Rx and scaled values", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 21 },
      load: { kind: "RX_SCALED", rxKg: 30, scaledKg: 20 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("21 • Rx 30kg / Sc 20kg");
  });

  it("renders a BANDED load with the tension descriptor in parens", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 8 },
      load: { kind: "BANDED", tension: "red" },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("8 • Banded (red)");
  });

  it("renders a BODYWEIGHT_PLUS load with the BW + prefix", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 6 },
      load: { kind: "BODYWEIGHT_PLUS", addedKg: 10 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("6 • BW + 10kg");
  });

  it("renders a PERCENT_BENCHMARK load as percent benchmark", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 3 },
      load: {
        kind: "PERCENT_BENCHMARK",
        benchmarkExerciseId: "ckxw5p7gp0000q1mnzv5cuq0a",
        percent: 75,
      },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("3 • 75% benchmark");
  });

  it("prefixes the tempo segment with @ when a tempoString is set", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 5 },
      tempo: { tempoString: "2-1-X-1" },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("5 • @ 2-1-X-1");
  });

  it("composes pause descriptors in the tempo segment when no tempoString is provided", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 5 },
      tempo: { pauseDownSec: 2, pauseUpSec: 1 },
    });

    expect(formatPrescriptionSummary(prescription)).toBe("5 • @ down 2s, up 1s");
  });

  it("omits the sideMode segment when sideMode is BILATERAL", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 5 },
      sideMode: "BILATERAL",
    });

    expect(formatPrescriptionSummary(prescription)).toBe("5");
  });

  it("renders the sideMode segment lowercased in parens for EACH_ARM", () => {
    const prescription = buildPrescription({
      reps: { kind: "EACH_SIDE", value: 8 },
      sideMode: "EACH_ARM",
    });

    expect(formatPrescriptionSummary(prescription)).toBe("8/side • (each_arm)");
  });

  it("renders the sideMode segment lowercased in parens for EACH_LEG", () => {
    const prescription = buildPrescription({
      reps: { kind: "EACH_SIDE", value: 6 },
      sideMode: "EACH_LEG",
    });

    expect(formatPrescriptionSummary(prescription)).toBe("6/side • (each_leg)");
  });

  it("renders the sideMode segment lowercased in parens for ASYMMETRIC_HOLD", () => {
    const prescription = buildPrescription({
      durationSec: 30,
      sideMode: "ASYMMETRIC_HOLD",
    });

    expect(formatPrescriptionSummary(prescription)).toBe("0:30 • (asymmetric_hold)");
  });

  it("renders the sideMode segment lowercased in parens for UNILATERAL_ALTERNATING", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 10 },
      sideMode: "UNILATERAL_ALTERNATING",
    });

    expect(formatPrescriptionSummary(prescription)).toBe("10 • (unilateral_alternating)");
  });

  it("joins reps, load, tempo, and sideMode segments with the bullet separator in order", () => {
    const prescription = buildPrescription({
      reps: { kind: "FIXED", value: 5 },
      load: { kind: "BARBELL", kg: 100 },
      tempo: { tempoString: "2-1-X-1" },
      sideMode: "EACH_ARM",
    });

    expect(formatPrescriptionSummary(prescription)).toBe("5 • BB 100kg • @ 2-1-X-1 • (each_arm)");
  });

  it("emits all metric, load, tempo, and sideMode segments together when every field is set", () => {
    const prescription = buildPrescription({
      reps: { kind: "RANGE", min: 8, max: 12 },
      durationSec: 120,
      distanceM: 200,
      calories: 15,
      load: { kind: "KB", kg: 24 },
      tempo: { tempoString: "3-1-1-0" },
      sideMode: "EACH_ARM",
    });

    expect(formatPrescriptionSummary(prescription)).toBe(
      "8-12 • 2:00 • 200 m • 15 cal • KB 24kg • @ 3-1-1-0 • (each_arm)",
    );
  });
});
