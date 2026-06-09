import { describe, expect, it } from "vitest";

import type { NodeId } from "../components/axes/axis-draft.types";

import type { DraftArrangement } from "./arrangement-convert";
import { resolveArrangement } from "./arrangement-resolve";
import { asNodeId } from "./axis-draft-id";

const CUID = {
  trackDown: "ckschematrackdown00000001",
  trackUp: "ckschematrackup0000000002",
  rowCurl: "ckrowcurl0000000000000004",
  rowExt: "ckrowext00000000000000005",
};

const refMap = (entries: [string, string][]): Map<NodeId, string> =>
  new Map(entries.map(([draftId, cuid]) => [asNodeId(draftId), cuid]));

const fullParallelMap = (): Map<NodeId, string> =>
  refMap([
    ["track-down", CUID.trackDown],
    ["track-up", CUID.trackUp],
  ]);

const fullSupersetMap = (): Map<NodeId, string> =>
  refMap([
    ["row-curl", CUID.rowCurl],
    ["row-ext", CUID.rowExt],
  ]);

describe("resolveArrangement (QA-504)", () => {
  it("resolves a parallel arrangement field-by-field to server cuids (B4-AC)", () => {
    const deferred: DraftArrangement = {
      kind: "parallel",
      interleaveOrder: "track_by_track",
      tracks: [{ childSchemaId: asNodeId("track-down") }, { childSchemaId: asNodeId("track-up") }],
    };

    const result = resolveArrangement(deferred, fullParallelMap());

    expect(result).toEqual({
      ok: true,
      arrangement: {
        kind: "parallel",
        interleaveOrder: "track_by_track",
        tracks: [{ childSchemaId: CUID.trackDown }, { childSchemaId: CUID.trackUp }],
      },
    });
  });

  it("resolves a superset arrangement to server cuid rowIds (B4-AC)", () => {
    const deferred: DraftArrangement = {
      kind: "superset",
      pairs: [{ label: "Biceps / triceps", rowIds: [asNodeId("row-curl"), asNodeId("row-ext")] }],
    };

    const result = resolveArrangement(deferred, fullSupersetMap());

    expect(result).toEqual({
      ok: true,
      arrangement: {
        kind: "superset",
        pairs: [{ label: "Biceps / triceps", rowIds: [CUID.rowCurl, CUID.rowExt] }],
      },
    });
  });

  it("fails loud with the missing id when a parallel childSchemaId is absent from the map (B4-AC)", () => {
    const deferred: DraftArrangement = {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [{ childSchemaId: asNodeId("track-down") }, { childSchemaId: asNodeId("track-up") }],
    };
    const partialMap = refMap([["track-down", CUID.trackDown]]);

    const result = resolveArrangement(deferred, partialMap);

    expect(result).toEqual({ ok: false, missing: asNodeId("track-up") });
  });

  it("fails loud with the missing id when a superset rowId is absent from the map (B4-AC)", () => {
    const deferred: DraftArrangement = {
      kind: "superset",
      pairs: [{ label: "Biceps / triceps", rowIds: [asNodeId("row-curl"), asNodeId("row-ext")] }],
    };
    const partialMap = refMap([["row-curl", CUID.rowCurl]]);

    const result = resolveArrangement(deferred, partialMap);

    expect(result).toEqual({ ok: false, missing: asNodeId("row-ext") });
  });
});
