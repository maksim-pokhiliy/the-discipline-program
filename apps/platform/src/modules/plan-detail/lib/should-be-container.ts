import type { ComposeNode } from "../components/axes/axis-draft.types";

const MULTI_CHILD_THRESHOLD = 1;

export const shouldBeContainer = (node: ComposeNode): boolean => {
  if (node.nodeType === "row") {
    return false;
  }

  const hasRepetitionSemantics = node.repetition !== undefined && node.repetition.kind !== "once";
  const hasArrangementSemantics =
    node.arrangement !== undefined && node.arrangement.kind !== "ordered";
  const hasScoringSemantics = node.scoring !== undefined && node.scoring.kind !== "prescribed";
  const hasMultipleChildren = node.children.length > MULTI_CHILD_THRESHOLD;

  return (
    hasRepetitionSemantics || hasArrangementSemantics || hasScoringSemantics || hasMultipleChildren
  );
};
