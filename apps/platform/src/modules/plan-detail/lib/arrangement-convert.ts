import type {
  ArrangementAxis,
  ComposeContainer,
  NodeId,
  SupersetPairDraft,
} from "../components/axes/axis-draft.types";

import { collectDirectRows } from "./arrangement-tree";

export type DraftArrangement = Exclude<ArrangementAxis, { kind: "ordered" }>;

export type ConvertIssue = { path: string; message: string };

const MIN_PAIRS = 1;
const MIN_PAIR_ROWS = 2;

const issueAt = (path: string, suffix: string, message: string): ConvertIssue => ({
  path: `${path}.composition.arrangement${suffix}`,
  message,
});

const collectDirectRowIds = (container: ComposeContainer): Set<NodeId> =>
  new Set(collectDirectRows(container).map((row) => row.id));

const validateSupersetPair = (
  pair: SupersetPairDraft,
  index: number,
  rowIds: Set<NodeId>,
  path: string,
  issues: ConvertIssue[],
): void => {
  if (pair.label.trim() === "") {
    issues.push(issueAt(path, `.pairs[${index}].label`, "a superset pair needs a label"));
  }

  if (new Set(pair.rowIds).size < MIN_PAIR_ROWS) {
    issues.push(
      issueAt(path, `.pairs[${index}].rowIds`, "a superset pair needs at least two distinct rows"),
    );
  }

  pair.rowIds.forEach((rowId, rowIndex) => {
    if (!rowIds.has(rowId)) {
      issues.push(
        issueAt(path, `.pairs[${index}].rowIds[${rowIndex}]`, "pair references a missing row"),
      );
    }
  });
};

const validateSuperset = (
  container: ComposeContainer,
  pairs: SupersetPairDraft[],
  path: string,
  issues: ConvertIssue[],
): void => {
  if (pairs.length < MIN_PAIRS) {
    issues.push(issueAt(path, ".pairs", "a superset arrangement needs at least one pair"));
  }

  const rowIds = collectDirectRowIds(container);

  pairs.forEach((pair, index) => validateSupersetPair(pair, index, rowIds, path, issues));
};

export const validateDeferredArrangement = (
  arrangement: ArrangementAxis,
  container: ComposeContainer,
  path: string,
  issues: ConvertIssue[],
): boolean => {
  const before = issues.length;

  if (arrangement.kind === "superset") {
    validateSuperset(container, arrangement.pairs, path, issues);
  }

  return issues.length === before;
};
