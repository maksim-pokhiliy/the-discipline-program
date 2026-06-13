import type { PerLimbDistribution, TempoModifier } from "@repo/contracts/lms/_shared";

export const eachLeg = (countPerLimb?: number): PerLimbDistribution =>
  countPerLimb === undefined ? { kind: "each_leg" } : { kind: "each_leg", countPerLimb };

export const eachArm = (countPerLimb?: number): PerLimbDistribution =>
  countPerLimb === undefined ? { kind: "each_arm" } : { kind: "each_arm", countPerLimb };

export const explicitSplit = (side: "left" | "right"): PerLimbDistribution => ({
  kind: "explicit_split",
  side,
});

export const alternating = (sourceAnnotation?: string): PerLimbDistribution =>
  sourceAnnotation === undefined
    ? { kind: "alternating" }
    : { kind: "alternating", sourceAnnotation };

export type FullTempoInput = {
  eccentric: number | "X";
  pauseBottom: number | "X";
  concentric: number | "X";
  pauseTop: number | "X";
};

export const fullTempo = (input: FullTempoInput): TempoModifier => input;
