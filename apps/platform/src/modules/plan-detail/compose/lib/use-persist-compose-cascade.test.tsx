import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as Hooks from "@app/lib/hooks";

import type { CreateSchemaPlanNode } from "./compose-to-create-requests";

type Call = { hook: "schema" | "row"; args: Record<string, unknown> };

const calls: Call[] = [];
const schemaMutateAsync = vi.fn();
const rowMutateAsync = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateSchema: () => ({ mutateAsync: schemaMutateAsync, isPending: false }),
    useCreateSchemaRow: () => ({ mutateAsync: rowMutateAsync, isPending: false }),
  };
});

const { usePersistComposeCascade } = await import("./use-persist-compose-cascade");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const node = (overrides: Partial<CreateSchemaPlanNode>): CreateSchemaPlanNode => ({
  schema: { composition: {} },
  rows: [],
  children: [],
  ...overrides,
});

const restRow = (): CreateSchemaPlanNode["rows"][number] => ({
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
});

const renderPersist = () =>
  renderHook(() => usePersistComposeCascade(PLAN_ID, START_DATE)).result.current.persist;

beforeEach(() => {
  calls.length = 0;
  schemaMutateAsync.mockReset();
  rowMutateAsync.mockReset();

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
