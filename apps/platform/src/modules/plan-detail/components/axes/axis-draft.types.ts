import type {
  Intensity,
  Load,
  PerLimbDistribution,
  RepNotation,
  RestSpec,
  TempoModifier,
  TimeCap,
} from "@repo/contracts/lms/_shared";
import type { Position, RowKind, SchemaRowPayload } from "@repo/contracts/lms/schema-row";

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

export type ComposeContainer = {
  nodeType: "container";
  id: NodeId;
  header: string | null;
  notes: string | null;
  repetition?: RepetitionAxis;
  rest?: RestAxis;
  children: ComposeNode[];
};

export type ComposeRow = {
  nodeType: "row";
  id: NodeId;
  rowKind: RowKind;
  rowPayload: SchemaRowPayload;
  reps: RepNotation | null;
  load: Load | null;
  side: PerLimbDistribution | null;
  tempo: TempoModifier | null;
  position: Position | null;
  intensity: Intensity | null;
  notes: string | null;
  editorDraft: unknown;
};

export type ComposeNode = ComposeContainer | ComposeRow;
