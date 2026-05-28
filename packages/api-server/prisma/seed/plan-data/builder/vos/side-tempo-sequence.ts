import type {
  PerLimbDistribution,
  SequenceIndicator,
  TempoModifier,
} from "@repo/contracts/lms/_shared";

export const eachLeg = (countPerLimb?: number): PerLimbDistribution =>
  countPerLimb === undefined ? { kind: "each_leg" } : { kind: "each_leg", countPerLimb };

export const eachArm = (countPerLimb?: number): PerLimbDistribution =>
  countPerLimb === undefined ? { kind: "each_arm" } : { kind: "each_arm", countPerLimb };

export const explicitSplit = (side: "left" | "right", pairedRowId?: string): PerLimbDistribution =>
  pairedRowId === undefined
    ? { kind: "explicit_split", side }
    : { kind: "explicit_split", side, pairedRowId };

export const alternating = (sourceAnnotation?: string): PerLimbDistribution =>
  sourceAnnotation === undefined
    ? { kind: "alternating" }
    : { kind: "alternating", sourceAnnotation };

export type FullTempoInput = {
  eccentric: number;
  pauseBottom: number;
  concentric: number;
  pauseTop: number;
};

export const fullTempo = (input: FullTempoInput): TempoModifier => ({ fullTempo: input });

export const slowEccentric = (durationSec: number): TempoModifier => ({
  slowEccentric: { durationSec },
});

export const pauseInUp = (durationSec: number): TempoModifier => ({
  pauseInUp: { durationSec, position: "up" },
});

export const holdAfterLast = (durationSec: number): TempoModifier => ({
  holdAfterLast: { durationSec },
});

export const perNthRepPause = (everyN: number, pauseSec: number): TempoModifier => ({
  perNthRepPause: { everyN, pauseSec },
});

export const beforeNamed = (targetLabel: string): SequenceIndicator => ({
  kind: "before_named",
  targetLabel,
});

export const afterNamed = (targetLabel: string): SequenceIndicator => ({
  kind: "after_named",
  targetLabel,
});

export const beforeNamedAfterNamedComposite = (
  beforeLabel: string,
  afterLabel: string,
): SequenceIndicator => ({
  kind: "before_named_after_named_composite",
  beforeLabel,
  afterLabel,
});

export const onlyOnceBefore = (targetLabel: string): SequenceIndicator => ({
  kind: "only_once_before",
  targetLabel,
});

export const afterEachRound = (): SequenceIndicator => ({ kind: "after_each_round" });

export const afterEachTypedRound = (type: string): SequenceIndicator => ({
  kind: "after_each_typed_round",
  type,
});
