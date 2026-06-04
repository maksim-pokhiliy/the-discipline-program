import { describe, expect, it } from "vitest";

import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
} from "../compose-tree.types";

import { type ConvertIssue, validateDeferredArrangement } from "./arrangement-convert";
import { asNodeId } from "./id-factory";

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

const track = (id: string, children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  children,
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

const parallelHost = (): ComposeContainer =>
  container("parallel-host", [
    track("track-down", [row("track-down-row")]),
    track("track-up", [row("track-up-row")]),
  ]);

const supersetHost = (): ComposeContainer =>
  container("superset-host", [row("row-curl"), row("row-ext"), row("row-plank")]);

describe("validateDeferredArrangement (QA-504)", () => {
  it("accepts a valid parallel with two distinct tracks and no issue (B4-AC)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [{ childSchemaId: asNodeId("track-down") }, { childSchemaId: asNodeId("track-up") }],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it("accepts a valid superset with one pair of two distinct direct rows and no issue (B4-AC)", () => {
    const arrangement: ArrangementAxis = {
      kind: "superset",
      pairs: [{ label: "Biceps / triceps", rowIds: [asNodeId("row-curl"), asNodeId("row-ext")] }],
    };

    const { ok, issues } = validate(arrangement, supersetHost());

    expect(ok).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it("rejects a parallel with fewer than two tracks (QA-203)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [{ childSchemaId: asNodeId("track-down") }],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(false);
    expect(issues.some((issue) => issue.path === `${PATH}.composition.arrangement.tracks`)).toBe(
      true,
    );
  });

  it("rejects a parallel with duplicate childSchemaId (QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down") },
        { childSchemaId: asNodeId("track-down") },
      ],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(false);
    expect(
      issues.some(
        (issue) =>
          issue.path === `${PATH}.composition.arrangement.tracks` &&
          issue.message.includes("distinct"),
      ),
    ).toBe(true);
  });

  it("rejects a parallel track with a dangling childSchemaId (QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down") },
        { childSchemaId: asNodeId("not-a-child") },
      ],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(false);
    expect(
      issues.some(
        (issue) => issue.path === `${PATH}.composition.arrangement.tracks[1].childSchemaId`,
      ),
    ).toBe(true);
  });

  it("rejects a parallel track with non-positive setEnumeration (QA-202, QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down"), setEnumeration: [0] },
        { childSchemaId: asNodeId("track-up") },
      ],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(false);
    expect(
      issues.some(
        (issue) => issue.path === `${PATH}.composition.arrangement.tracks[0].setEnumeration`,
      ),
    ).toBe(true);
  });

  it("rejects a parallel track with a negative setEnumeration value (QA-202, QA-504)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down"), setEnumeration: [21, -15, 9] },
        { childSchemaId: asNodeId("track-up") },
      ],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(false);
    expect(
      issues.some(
        (issue) => issue.path === `${PATH}.composition.arrangement.tracks[0].setEnumeration`,
      ),
    ).toBe(true);
  });

  it("accepts a parallel track whose pairedWithRowId is a row of a sibling track (B4-AC)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down") },
        { childSchemaId: asNodeId("track-up"), pairedWithRowId: asNodeId("track-down-row") },
      ],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it("rejects a parallel track whose pairedWithRowId belongs to the same track (QA-101)", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down"), pairedWithRowId: asNodeId("track-down-row") },
        { childSchemaId: asNodeId("track-up") },
      ],
    };

    const { ok, issues } = validate(arrangement, parallelHost());

    expect(ok).toBe(false);
    expect(
      issues.some(
        (issue) => issue.path === `${PATH}.composition.arrangement.tracks[0].pairedWithRowId`,
      ),
    ).toBe(true);
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
      validateDeferredArrangement({ kind: "ordered" }, parallelHost(), PATH, issues);

    expect(run).not.toThrow();
    expect(run()).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it("never throws for a deeply malformed arrangement and returns false", () => {
    const arrangement: ArrangementAxis = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("ghost-a"), setEnumeration: [-1] },
        { childSchemaId: asNodeId("ghost-a"), pairedWithRowId: asNodeId("nowhere") },
      ],
    };
    const issues: ConvertIssue[] = [];
    const run = () => validateDeferredArrangement(arrangement, parallelHost(), PATH, issues);

    expect(run).not.toThrow();
    expect(run()).toBe(false);
  });
});
