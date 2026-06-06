import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as Hooks from "@app/lib/hooks";

import type { SchemaCompositionUpdate } from "./diff-compose-axes";

const updateMutateAsync = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateSchema: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  };
});

const { useEditComposeAxes } = await import("./use-edit-compose-axes");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const SCHEMA_A_CUID = "ckeditaxistopaaaaaaaaaaaa";
const SCHEMA_B_CUID = "ckeditaxischildaaaaaaaaaa";

const updateA: SchemaCompositionUpdate = {
  schemaId: SCHEMA_A_CUID,
  composition: { repetition: { kind: "count", count: 5 } },
};

const updateB: SchemaCompositionUpdate = {
  schemaId: SCHEMA_B_CUID,
  composition: { repetition: { kind: "count", count: 7 } },
};

const renderSaveEdits = () =>
  renderHook(() => useEditComposeAxes(PLAN_ID, START_DATE)).result.current.saveEdits;

beforeEach(() => {
  updateMutateAsync.mockReset();
});

describe("useEditComposeAxes.saveEdits", () => {
  it("fires one PUT per update in order and reports success when all resolve", async () => {
    updateMutateAsync.mockResolvedValue({ id: SCHEMA_A_CUID });

    const saveEdits = renderSaveEdits();

    const result = await saveEdits([updateA, updateB]);

    expect(result).toEqual({ ok: true });
    expect(updateMutateAsync).toHaveBeenCalledTimes(2);
    expect(updateMutateAsync).toHaveBeenNthCalledWith(1, {
      schemaId: SCHEMA_A_CUID,
      data: { composition: updateA.composition },
    });
    expect(updateMutateAsync).toHaveBeenNthCalledWith(2, {
      schemaId: SCHEMA_B_CUID,
      data: { composition: updateB.composition },
    });
  });

  it("returns {ok:false,error} when a later PUT rejects, after the earlier PUT already fired (partial-edit semantics)", async () => {
    const failure = new Error("400 second update rejected");

    updateMutateAsync.mockResolvedValueOnce({ id: SCHEMA_A_CUID }).mockRejectedValueOnce(failure);

    const saveEdits = renderSaveEdits();

    const result = await saveEdits([updateA, updateB]);

    expect(result).toEqual({ ok: false, error: failure });
    expect(updateMutateAsync).toHaveBeenCalledTimes(2);
    expect(updateMutateAsync).toHaveBeenNthCalledWith(1, {
      schemaId: SCHEMA_A_CUID,
      data: { composition: updateA.composition },
    });
  });
});
