import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeContainer, ComposeRow, NodeId } from "../components/axes/axis-draft.types";

import { collectDirectRows } from "./arrangement-tree";
import { buildRowSummary } from "./draft-row-summary";

export type ArrangementTargetRef = { id: NodeId; label: string };

export type ArrangementTargets = {
  directRows: ArrangementTargetRef[];
};

const toRowRef = (row: ComposeRow, exerciseById: Map<string, Exercise>): ArrangementTargetRef => ({
  id: row.id,
  label: buildRowSummary(row, exerciseById).label,
});

export const collectArrangementTargets = (
  container: ComposeContainer,
  exerciseById: Map<string, Exercise>,
): ArrangementTargets => ({
  directRows: collectDirectRows(container).map((row) => toRowRef(row, exerciseById)),
});
