import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeContainer, ComposeRow, NodeId } from "../components/axes/axis-draft.types";

import { collectDirectRows, collectTrackChildren } from "./arrangement-tree";
import { buildRowSummary } from "./draft-row-summary";

export type ArrangementTargetRef = { id: NodeId; label: string };

export type ArrangementTargets = {
  childContainers: ArrangementTargetRef[];
  directRows: ArrangementTargetRef[];
};

const CONTAINER_FALLBACK_LABEL = "group";

const containerLabel = (container: ComposeContainer): string =>
  container.header ?? CONTAINER_FALLBACK_LABEL;

const toRowRef = (row: ComposeRow, exerciseById: Map<string, Exercise>): ArrangementTargetRef => ({
  id: row.id,
  label: buildRowSummary(row, exerciseById).label,
});

export const collectArrangementTargets = (
  container: ComposeContainer,
  exerciseById: Map<string, Exercise>,
): ArrangementTargets => {
  const trackChildren = collectTrackChildren(container);

  return {
    childContainers: trackChildren.map((child) => ({ id: child.id, label: containerLabel(child) })),
    directRows: collectDirectRows(container).map((row) => toRowRef(row, exerciseById)),
  };
};
