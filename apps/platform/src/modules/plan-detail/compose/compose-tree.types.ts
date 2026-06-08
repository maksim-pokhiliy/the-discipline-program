export type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  NodeId,
  ParallelTrackDraft,
  RepetitionAxis,
  RestAxis,
  ScoringDirective,
  SupersetPairDraft,
} from "../components/axes/axis-draft.types";

import type { ComposeContainer, NodeId } from "../components/axes/axis-draft.types";

export type ComposeBlock = { id: NodeId; label: string; root: ComposeContainer };

export type ComposeSession = { id: NodeId; label: string; blocks: ComposeBlock[] };

export type ComposeDay = { id: NodeId; label: string; sessions: ComposeSession[] };

export type ComposeWeek = { id: NodeId; label: string; days: ComposeDay[] };

export type ComposeProgram = { weeks: ComposeWeek[] };
