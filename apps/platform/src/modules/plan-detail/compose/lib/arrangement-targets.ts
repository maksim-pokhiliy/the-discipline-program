import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeContainer, ComposeRow, NodeId } from "../compose-tree.types";

import { collectDescendantRows, collectDirectRows, collectTrackChildren } from "./arrangement-tree";
import { buildRowSummary } from "./row-summary";

export type ArrangementTargetRef = { id: NodeId; label: string };

export type ArrangementTargets = {
  childContainers: ArrangementTargetRef[];
  directRows: ArrangementTargetRef[];
  rowsByTrack: Record<NodeId, ArrangementTargetRef[]>;
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
  const rowsByTrack: Record<NodeId, ArrangementTargetRef[]> = {};

  for (const track of trackChildren) {
    rowsByTrack[track.id] = collectDescendantRows(track).map((row) => toRowRef(row, exerciseById));
  }

  return {
    childContainers: trackChildren.map((child) => ({ id: child.id, label: containerLabel(child) })),
    directRows: collectDirectRows(container).map((row) => toRowRef(row, exerciseById)),
    rowsByTrack,
  };
};
