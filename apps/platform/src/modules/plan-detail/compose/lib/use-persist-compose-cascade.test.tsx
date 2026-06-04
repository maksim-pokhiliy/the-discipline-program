import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as Hooks from "@app/lib/hooks";

import type { CreateSchemaPlanNode } from "./compose-to-create-requests";
import { asNodeId } from "./id-factory";

type Call = { hook: "schema" | "row" | "update"; args: Record<string, unknown> };

const calls: Call[] = [];
const schemaMutateAsync = vi.fn();
const rowMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateSchema: () => ({ mutateAsync: schemaMutateAsync, isPending: false }),
    useCreateSchemaRow: () => ({ mutateAsync: rowMutateAsync, isPending: false }),
    useUpdateSchema: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  };
});

const { usePersistComposeCascade } = await import("./use-persist-compose-cascade");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let nodeCounter = 0;

const node = (overrides: Partial<CreateSchemaPlanNode>): CreateSchemaPlanNode => {
  nodeCounter += 1;

  return {
    draftNodeId: asNodeId(`draft-node-${nodeCounter}`),
    schema: { composition: {} },
    rows: [],
    children: [],
    ...overrides,
  };
};

const restRow = (): CreateSchemaPlanNode["rows"][number] => {
  nodeCounter += 1;

  return {
    draftNodeId: asNodeId(`draft-row-${nodeCounter}`),
    row: {
      rowKind: "REST_SLOT",
      rowPayload: { rowKind: "REST_SLOT" },
      load: null,
      reps: null,
      side: null,
      tempo: null,
      position: null,
      intensity: null,
      notes: null,
    },
  };
};

const namedRow = (draftId: string): CreateSchemaPlanNode["rows"][number] => ({
  draftNodeId: asNodeId(draftId),
  row: {
    rowKind: "REST_SLOT",
    rowPayload: { rowKind: "REST_SLOT" },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  },
});

const trackChild = (draftId: string, rowDraftId: string): CreateSchemaPlanNode =>
  node({ draftNodeId: asNodeId(draftId), rows: [namedRow(rowDraftId)] });

const parallelContainer = (draftId: string): CreateSchemaPlanNode =>
  node({
    draftNodeId: asNodeId(draftId),
    schema: { composition: { repetition: { kind: "count", count: 3 } } },
    deferredArrangement: {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId(`${draftId}-down`), setEnumeration: [21, 15, 9] },
        {
          childSchemaId: asNodeId(`${draftId}-up`),
          pairedWithRowId: asNodeId(`${draftId}-down-row`),
        },
      ],
    },
    children: [
      trackChild(`${draftId}-down`, `${draftId}-down-row`),
      trackChild(`${draftId}-up`, `${draftId}-up-row`),
    ],
  });

const supersetContainer = (draftId: string): CreateSchemaPlanNode =>
  node({
    draftNodeId: asNodeId(draftId),
    schema: {
      composition: { rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" } },
    },
    rows: [namedRow(`${draftId}-curl`), namedRow(`${draftId}-ext`)],
    deferredArrangement: {
      kind: "superset",
      pairs: [
        {
          label: "Biceps / triceps",
          rowIds: [asNodeId(`${draftId}-curl`), asNodeId(`${draftId}-ext`)],
        },
      ],
    },
  });

const collectRefs = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectRefs);
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(collectRefs);
  }

  return [];
};

const updateCalls = (): Call[] => calls.filter((call) => call.hook === "update");

const renderPersist = () =>
  renderHook(() => usePersistComposeCascade(PLAN_ID, START_DATE)).result.current.persist;

beforeEach(() => {
  calls.length = 0;
  nodeCounter = 0;
  schemaMutateAsync.mockReset();
  rowMutateAsync.mockReset();
  updateMutateAsync.mockReset();

  let schemaCounter = 0;

  schemaMutateAsync.mockImplementation((args: Record<string, unknown>) => {
    calls.push({ hook: "schema", args });
    schemaCounter += 1;

    return Promise.resolve({ id: `ckschema00000000000000${schemaCounter}` });
  });

  rowMutateAsync.mockImplementation((args: Record<string, unknown>) => {
    calls.push({ hook: "row", args });

    return Promise.resolve({ id: `ckrow0000000000000000000${calls.length}` });
  });

  updateMutateAsync.mockImplementation((args: Record<string, unknown>) => {
    calls.push({ hook: "update", args });

    return Promise.resolve({ id: String(args.schemaId) });
  });
});

describe("usePersistComposeCascade", () => {
  it("creates one schema then its three rows in order with the returned cuid", async () => {
    const persist = renderPersist();

    const result = await persist([node({ rows: [restRow(), restRow(), restRow()] })], BLOCK_ID);

    expect(result).toEqual({ ok: true });
    expect(calls.map((call) => call.hook)).toEqual(["schema", "row", "row", "row"]);
    expect(calls[0]?.args).toMatchObject({ blockId: BLOCK_ID });
    expect(calls[1]?.args).toMatchObject({ schemaId: "ckschema000000000000001" });
    expect(calls[2]?.args).toMatchObject({ schemaId: "ckschema000000000000001" });
    expect(calls[3]?.args).toMatchObject({ schemaId: "ckschema000000000000001" });
  });

  it("creates a parent before its child and threads the parent cuid as parentSchemaId", async () => {
    const persist = renderPersist();

    const result = await persist(
      [node({ children: [node({ schema: { composition: {} } })] })],
      BLOCK_ID,
    );

    expect(result).toEqual({ ok: true });
    expect(calls.map((call) => call.hook)).toEqual(["schema", "schema"]);
    expect(calls[0]?.args).toMatchObject({ blockId: BLOCK_ID });
    expect(calls[0]?.args).not.toHaveProperty("parentSchemaId");
    expect(calls[1]?.args).toMatchObject({
      blockId: BLOCK_ID,
      parentSchemaId: "ckschema000000000000001",
    });
  });

  it("stops on a mid-cascade rejection and reports the created count", async () => {
    rowMutateAsync.mockReset();
    rowMutateAsync.mockImplementation((args: Record<string, unknown>) => {
      calls.push({ hook: "row", args });

      return Promise.reject(new Error("400 ladder collision"));
    });

    const persist = renderPersist();

    const result = await persist([node({ rows: [restRow(), restRow(), restRow()] })], BLOCK_ID);

    expect(result).toEqual({ ok: false, createdCount: 1, error: expect.any(Error) });
    expect(calls.map((call) => call.hook)).toEqual(["schema", "row"]);
    expect(rowMutateAsync).toHaveBeenCalledTimes(1);
  });

  it("never passes a draft UUID as blockId, parentSchemaId or schemaId", async () => {
    const persist = renderPersist();

    await persist([node({ rows: [restRow()], children: [node({ rows: [restRow()] })] })], BLOCK_ID);

    const refs = calls.flatMap((call) =>
      [call.args.blockId, call.args.parentSchemaId, call.args.schemaId].filter(
        (ref): ref is string => typeof ref === "string",
      ),
    );

    expect(refs.length).toBeGreaterThan(0);

    for (const ref of refs) {
      expect(ref === BLOCK_ID || ref.startsWith("ck")).toBe(true);
      expect(UUID_PATTERN.test(ref)).toBe(false);
    }
  });
});

describe("usePersistComposeCascade phase-2 ref wiring (QA-502)", () => {
  it("issues exactly one update per arrangement container after phase-1 creates", async () => {
    const persist = renderPersist();

    const result = await persist([parallelContainer("par")], BLOCK_ID);

    expect(result).toEqual({ ok: true });
    expect(updateCalls()).toHaveLength(1);
    expect(calls.map((call) => call.hook)).toEqual([
      "schema",
      "schema",
      "row",
      "schema",
      "row",
      "update",
    ]);
  });

  it("targets the arrangement container's own mapped cuid as the update schemaId", async () => {
    const persist = renderPersist();

    await persist([parallelContainer("par")], BLOCK_ID);

    expect(updateCalls()[0]?.args.schemaId).toBe("ckschema000000000000001");
  });

  it("sends the whole composition carrying both the phase-1 axes and the resolved arrangement", async () => {
    const persist = renderPersist();

    await persist([parallelContainer("par")], BLOCK_ID);

    const data = updateCalls()[0]?.args.data as { composition?: Record<string, unknown> };

    expect(data.composition).toMatchObject({ repetition: { kind: "count", count: 3 } });
    expect(data.composition?.arrangement).toMatchObject({
      kind: "parallel",
      interleaveOrder: "round_by_round",
    });
  });

  it("resolves every parallel arrangement ref to a server cuid, never a draft id (extends the no-UUID invariant)", async () => {
    const persist = renderPersist();

    await persist([parallelContainer("par")], BLOCK_ID);

    const data = updateCalls()[0]?.args.data as { composition?: { arrangement?: unknown } };
    const refs = collectRefs(data.composition?.arrangement).filter(
      (ref) => ref !== "parallel" && ref !== "round_by_round",
    );
    const trackRefs = refs.filter((ref) => ref.startsWith("ck"));

    expect(trackRefs.length).toBeGreaterThanOrEqual(3);

    for (const ref of trackRefs) {
      expect(ref).toMatch(/^ck/);
      expect(UUID_PATTERN.test(ref)).toBe(false);
      expect(ref.startsWith("draft-")).toBe(false);
    }
  });

  it("preserves the setEnumeration literal through resolution", async () => {
    const persist = renderPersist();

    await persist([parallelContainer("par")], BLOCK_ID);

    const data = updateCalls()[0]?.args.data as {
      composition?: { arrangement?: { tracks?: { setEnumeration?: number[] }[] } };
    };

    expect(data.composition?.arrangement?.tracks?.[0]?.setEnumeration).toEqual([21, 15, 9]);
  });

  it("wires a superset arrangement with resolved cuid rowIds (superset analogue)", async () => {
    const persist = renderPersist();

    const result = await persist([supersetContainer("sup")], BLOCK_ID);

    expect(result).toEqual({ ok: true });
    expect(updateCalls()).toHaveLength(1);

    const data = updateCalls()[0]?.args.data as {
      composition?: { arrangement?: { kind?: string; pairs?: { rowIds?: string[] }[] } };
    };
    const rowIds = data.composition?.arrangement?.pairs?.[0]?.rowIds ?? [];

    expect(data.composition?.arrangement?.kind).toBe("superset");
    expect(rowIds).toHaveLength(2);

    for (const rowId of rowIds) {
      expect(rowId.startsWith("ck")).toBe(true);
      expect(UUID_PATTERN.test(rowId)).toBe(false);
    }
  });

  it("returns a partial result when a phase-2 update rejects, with createdCount from phase-1", async () => {
    updateMutateAsync.mockReset();
    updateMutateAsync.mockImplementation((args: Record<string, unknown>) => {
      calls.push({ hook: "update", args });

      return Promise.reject(new Error("400 arrangement ref out of scope"));
    });

    const persist = renderPersist();

    const result = await persist([parallelContainer("par")], BLOCK_ID);

    expect(result).toEqual({ ok: false, createdCount: 5, error: expect.any(Error) });
    expect(updateMutateAsync).toHaveBeenCalledTimes(1);
  });
});

describe("usePersistComposeCascade multi-container partial wiring (QA-204)", () => {
  it("wires the first arrangement container before the second update rejects (baseline for a future rollback fix)", async () => {
    let updateCount = 0;

    updateMutateAsync.mockReset();
    updateMutateAsync.mockImplementation((args: Record<string, unknown>) => {
      calls.push({ hook: "update", args });
      updateCount += 1;

      if (updateCount === 2) {
        return Promise.reject(new Error("400 second arrangement out of scope"));
      }

      return Promise.resolve({ id: String(args.schemaId) });
    });

    const persist = renderPersist();

    const result = await persist(
      [parallelContainer("par-a"), parallelContainer("par-b")],
      BLOCK_ID,
    );

    expect(result.ok).toBe(false);
    expect(updateMutateAsync).toHaveBeenCalledTimes(2);

    const firstUpdate = updateCalls()[0];

    expect(firstUpdate?.args.schemaId).toBe("ckschema000000000000001");

    const firstData = firstUpdate?.args.data as { composition?: { arrangement?: unknown } };

    expect(firstData.composition?.arrangement).toMatchObject({ kind: "parallel" });
  });
});
