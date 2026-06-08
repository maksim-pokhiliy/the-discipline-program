import type { RowKind } from "@repo/contracts/lms/schema-row";

import type { ComposeContainer, RepetitionAxis } from "../components/axes/axis-draft.types";

const LADDER_MARKER_ROW_KIND: RowKind = "INNER_LADDER_MARKER";
const LADDER_KIND: RepetitionAxis["kind"] = "ladder";

export const LADDER_MARKER_CONFLICT =
  "A ladder rep-scheme group can't also hold an inner-ladder-marker row — move the marker out or change the repetition.";

export const hasLadderMarkerConflict = (container: ComposeContainer): boolean => {
  const isLadder = container.repetition?.kind === LADDER_KIND;

  if (!isLadder) {
    return false;
  }

  return container.children.some(
    (child) => child.nodeType === "row" && child.rowKind === LADDER_MARKER_ROW_KIND,
  );
};
