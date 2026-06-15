import type {
  Intensity,
  Load,
  PerLimbDistribution,
  RepNotation,
  RestSpec,
  TempoModifier,
  TimeCap,
} from "@repo/contracts/lms/_shared";
import type { ModifierRef } from "@repo/contracts/lms/modifier";

import type { CountOrRangeValue } from "../count-or-range-field";

export type NodeId = string & { readonly __brand: "ComposeNodeId" };

export type RepetitionAxis =
  | { kind: "once" }
  | { kind: "count"; count: CountOrRangeValue }
  | { kind: "ladder"; steps: number[] }
  | { kind: "timeCap"; cap: TimeCap }
  | { kind: "cadence"; everyMin: number; rounds: number }
  | { kind: "interval"; workMin: number; offMin: number; count: number };

export type RestAxis = RestSpec;

export type ComposeRow = {
  nodeType: "row";
  id: NodeId;
  exerciseId: string;
  sets: number | null;
  rowGroupId: string | null;
  reps: RepNotation | null;
  load: Load | null;
  side: PerLimbDistribution | null;
  tempo: TempoModifier | null;
  modifiers: ModifierRef[];
  notes: string[] | null;
  editorDraft: unknown;
};

export type SchemaDraft = {
  id: NodeId;
  header: string | null;
  notes: string[] | null;
  repetition?: RepetitionAxis;
  rest?: RestAxis;
  intensity?: Intensity | null;
  rows: ComposeRow[];
};
