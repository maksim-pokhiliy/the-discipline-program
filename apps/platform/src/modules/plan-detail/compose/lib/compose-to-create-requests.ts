import type {
  Composition,
  RepetitionAxis as ContractRepetitionAxis,
  ScoringDirective as ContractScoringDirective,
} from "@repo/contracts/lms/composition";
import { compositionSchema } from "@repo/contracts/lms/composition";
import type { CreateSchemaRequest } from "@repo/contracts/lms/schema";
import type { CreateSchemaRowRequest } from "@repo/contracts/lms/schema-row";

import type {
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  NodeId,
  RepetitionAxis,
  ScoringDirective,
} from "../compose-tree.types";

import {
  type ConvertIssue,
  type DraftArrangement,
  validateDeferredArrangement,
} from "./arrangement-convert";
import { isRowCommitted } from "./make-row";

export type { ConvertIssue, DraftArrangement };

export type RowWithDraftId = {
  draftNodeId: NodeId;
  row: Omit<CreateSchemaRowRequest, "schemaId">;
};

export type CreateSchemaPlanNode = {
  draftNodeId: NodeId;
  schema: Omit<CreateSchemaRequest, "blockId" | "parentSchemaId">;
  rows: RowWithDraftId[];
  deferredArrangement?: DraftArrangement;
  children: CreateSchemaPlanNode[];
};

export type ConvertResult =
  | { ok: true; nodes: CreateSchemaPlanNode[] }
  | { ok: false; issues: ConvertIssue[] };

const mapRepetition = (repetition: RepetitionAxis): ContractRepetitionAxis => {
  switch (repetition.kind) {
    case "once":
      return { kind: "once" };
    case "count":
      return { kind: "count", count: repetition.count };
    case "ladder":
      return { kind: "ladder", steps: repetition.steps };
    case "timeCap":
      return { kind: "timeCap", cap: repetition.cap };
    case "cadence":
      return {
        kind: "cadence",
        everyMin: repetition.everyMin,
        rounds: repetition.rounds,
        ...(repetition.totalMin !== undefined && { totalMin: repetition.totalMin }),
      };
    case "window":
      return { kind: "window", startHhMm: repetition.startHhMm, endHhMm: repetition.endHhMm };
    case "interval":
      return {
        kind: "interval",
        workMin: repetition.workMin,
        offMin: repetition.offMin,
        count: repetition.count,
      };
    default:
      return repetition satisfies never;
  }
};

const mapScoring = (scoring: ScoringDirective): ContractScoringDirective => {
  switch (scoring.kind) {
    case "prescribed":
      return { kind: "prescribed" };
    case "amrap":
      return { kind: "amrap" };
    case "for_time":
      return { kind: "for_time" };
    case "max_in_remaining":
      return { kind: "max_in_remaining" };
    case "total":
      return { kind: "total" };
    case "progressive":
      return { kind: "progressive", seed: scoring.seed };
    default:
      return scoring satisfies never;
  }
};

export const composeContainerToComposition = (container: ComposeContainer): Composition => ({
  ...(container.repetition !== undefined && { repetition: mapRepetition(container.repetition) }),
  ...(container.scoring !== undefined && { scoring: mapScoring(container.scoring) }),
  ...(container.rest !== undefined && { rest: container.rest }),
  ...(container.programKind !== undefined && { programKind: container.programKind }),
});

const mapRow = (row: ComposeRow): Omit<CreateSchemaRowRequest, "schemaId"> => ({
  rowKind: row.rowKind,
  rowPayload: row.rowPayload,
  load: row.load,
  reps: row.reps,
  side: row.side,
  tempo: row.tempo,
  position: row.position,
  intensity: row.intensity,
  notes: row.notes,
});

const hasAnyAxis = (container: ComposeContainer): boolean =>
  container.repetition !== undefined ||
  container.arrangement !== undefined ||
  container.scoring !== undefined ||
  container.rest !== undefined ||
  container.programKind !== undefined;

const deferArrangement = (
  container: ComposeContainer,
  path: string,
  issues: ConvertIssue[],
): DraftArrangement | undefined => {
  const { arrangement } = container;

  if (arrangement === undefined || arrangement.kind === "ordered") {
    return undefined;
  }

  const isValid = validateDeferredArrangement(arrangement, container, path, issues);

  return isValid ? arrangement : undefined;
};

const convertContainer = (
  container: ComposeContainer,
  path: string,
  issues: ConvertIssue[],
): CreateSchemaPlanNode => {
  const assembled = composeContainerToComposition(container);
  const parsed = compositionSchema.safeParse(assembled);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({ path: `${path}.composition.${issue.path.join(".")}`, message: issue.message });
    }
  }

  const deferredArrangement = deferArrangement(container, path, issues);

  const node: CreateSchemaPlanNode = {
    draftNodeId: container.id,
    schema: {
      composition: parsed.success ? parsed.data : {},
      header: container.header,
      notes: container.notes,
    },
    rows: [],
    ...(deferredArrangement !== undefined && { deferredArrangement }),
    children: [],
  };

  collectChildren(container.children, path, node, issues);

  return node;
};

function collectChildren(
  children: ComposeNode[],
  parentPath: string,
  parentNode: CreateSchemaPlanNode,
  issues: ConvertIssue[],
): void {
  children.forEach((child, index) => {
    const childPath = `${parentPath}.children[${index}]`;

    if (child.nodeType === "row") {
      if (!isRowCommitted(child)) {
        issues.push({ path: childPath, message: "row is not configured" });

        return;
      }

      parentNode.rows.push({ draftNodeId: child.id, row: mapRow(child) });

      return;
    }

    parentNode.children.push(convertContainer(child, childPath, issues));
  });
}

export const composeRootToCreatePlan = (root: ComposeContainer): ConvertResult => {
  const issues: ConvertIssue[] = [];

  if (hasAnyAxis(root)) {
    issues.push({ path: "root", message: "block root cannot carry composition axes" });
  }

  const nodes: CreateSchemaPlanNode[] = [];

  root.children.forEach((child, index) => {
    const childPath = `root.children[${index}]`;

    if (child.nodeType === "row") {
      issues.push({ path: childPath, message: "block root cannot hold rows directly" });

      return;
    }

    nodes.push(convertContainer(child, childPath, issues));
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, nodes };
};
