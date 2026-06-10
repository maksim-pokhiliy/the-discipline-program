import { describe, expect, it } from "vitest";

import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
} from "../components/axes/axis-draft.types";

import { type ConvertIssue, validateDeferredArrangement } from "./arrangement-convert";
import { asNodeId } from "./axis-draft-id";

const row = (id: string): ComposeRow => ({
  nodeType: "row",
  id: asNodeId(id),
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: null,
});

const container = (id: string, children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  children,
});

const PATH = "root.children[0]";

const validate = (
  arrangement: ArrangementAxis,
  host: ComposeContainer,
): { ok: boolean; issues: ConvertIssue[] } => {
  const issues: ConvertIssue[] = [];
  const ok = validateDeferredArrangement(arrangement, host, PATH, issues);

  return { ok, issues };
};

const supersetHost = (): ComposeContainer =>
  container("superset-host", [row("row-curl"), row("row-ext"), row("row-plank")]);

describe("validateDeferredArrangement (QA-504)", () => {
  it("accepts a valid superset with one pair of two distinct direct rows and no issue (B4-AC)", () => {
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "Biceps / triceps", rowIds: [asNodeId("row-curl"), asNodeId("row-ext")] }],
    };

    const { ok, issues } = validate(arrangement, supersetHost());

    expect(ok).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it("rejects a superset with no pairs (QA-504)", () => {
    const arrangement: ArrangementAxis = { kind: "superset", pairs: [] };

    const { ok, issues } = validate(arrangement, supersetHost());

    expect(ok).toBe(false);
    expect(issues.some((issue) => issue.path === `${PATH}.composition.arrangement.pairs`)).toBe(
      true,
    );
  });

  it("rejects a superset pair with fewer than two distinct rows (QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "Solo", rowIds: [asNodeId("row-curl")] }],
    };

    const { ok, issues } = validate(arrangement, supersetHost());

    expect(ok).toBe(false);
    expect(
      issues.some((issue) => issue.path === `${PATH}.composition.arrangement.pairs[0].rowIds`),
    ).toBe(true);
  });

  it("rejects a superset pair with a blank label (QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "   ", rowIds: [asNodeId("row-curl"), asNodeId("row-ext")] }],
    };

    const { ok, issues } = validate(arrangement, supersetHost());

    expect(ok).toBe(false);
    expect(
      issues.some((issue) => issue.path === `${PATH}.composition.arrangement.pairs[0].label`),
    ).toBe(true);
  });

  it("rejects a superset pair referencing a row that is not a direct child (QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "Ghost", rowIds: [asNodeId("row-curl"), asNodeId("not-a-row")] }],
    };

    const { ok, issues } = validate(arrangement, supersetHost());

    expect(ok).toBe(false);
    expect(
      issues.some((issue) => issue.path === `${PATH}.composition.arrangement.pairs[0].rowIds[1]`),
    ).toBe(true);
  });

  it("rejects a superset over a grandchild row that is not a direct child (QA-201)", () => {
    const host = container("superset-grandchild-host", [
      container("nested-group", [row("grandchild-1"), row("grandchild-2")]),
    ]);
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "Nested", rowIds: [asNodeId("grandchild-1"), asNodeId("grandchild-2")] }],
    };

    const { ok, issues } = validate(arrangement, host);

    expect(ok).toBe(false);
    expect(
      issues.every((issue) =>
        issue.path.startsWith(`${PATH}.composition.arrangement.pairs[0].rowIds`),
      ),
    ).toBe(true);
  });

  it("never throws for an ordered arrangement and reports no issue", () => {
    const issues: ConvertIssue[] = [];
    const run = () =>
      validateDeferredArrangement({ kind: "ordered" }, supersetHost(), PATH, issues);

    expect(run).not.toThrow();
    expect(run()).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it("never throws for a deeply malformed arrangement and returns false", () => {
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "Ghosts", rowIds: [asNodeId("ghost-a"), asNodeId("ghost-a")] }],
    };
    const issues: ConvertIssue[] = [];
    const run = () => validateDeferredArrangement(arrangement, supersetHost(), PATH, issues);

    expect(run).not.toThrow();
    expect(run()).toBe(false);
  });
});
