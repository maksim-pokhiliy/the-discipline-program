import type {
  Intensity,
  Load,
  PerLimbDistribution,
  RepNotation,
  RestSpec,
  StagedProgramKind,
  TempoModifier,
  TimeCap,
} from "@repo/contracts/lms/_shared";
import type { ParallelInterleaveOrder } from "@repo/contracts/lms/composition";
import type { Position, RowKind, SchemaRowPayload } from "@repo/contracts/lms/schema-row";

import type { CountOrRangeValue } from "../components/count-or-range-field";

export type NodeId = string & { readonly __brand: "ComposeNodeId" };

export type RepetitionAxis =
  | { kind: "once" }
  | { kind: "count"; count: CountOrRangeValue }
  | { kind: "ladder"; steps: number[] }
  | { kind: "timeCap"; cap: TimeCap }
  | { kind: "cadence"; everyMin: number; rounds: number; totalMin?: number }
  | { kind: "window"; startHhMm: string; endHhMm: string }
  | { kind: "interval"; workMin: number; offMin: number; count: number };

export type ParallelTrackDraft = {
  childSchemaId: NodeId;
  setEnumeration?: number[];
  pairedWithRowId?: NodeId;
};

export type SupersetPairDraft = { label: string; rowIds: NodeId[] };

export type ArrangementAxis =
  | { kind: "ordered" }
  | { kind: "parallel"; interleaveOrder: ParallelInterleaveOrder; tracks: ParallelTrackDraft[] }
  | { kind: "superset"; pairs: SupersetPairDraft[] };

export type ScoringDirective =
  | { kind: "prescribed" }
  | { kind: "amrap" }
  | { kind: "for_time" }
  | { kind: "max_in_remaining" }
  | { kind: "total" }
  | { kind: "progressive"; seed: string };

export type RestAxis = RestSpec;

export type ComposeContainer = {
  nodeType: "container";
  id: NodeId;
  header: string | null;
  notes: string | null;
  repetition?: RepetitionAxis;
  arrangement?: ArrangementAxis;
  scoring?: ScoringDirective;
  rest?: RestAxis;
  programKind?: StagedProgramKind;
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

export type ComposeBlock = { id: NodeId; label: string; root: ComposeContainer };

export type ComposeSession = { id: NodeId; label: string; blocks: ComposeBlock[] };

export type ComposeDay = { id: NodeId; label: string; sessions: ComposeSession[] };

export type ComposeWeek = { id: NodeId; label: string; days: ComposeDay[] };

export type ComposeProgram = { weeks: ComposeWeek[] };
