import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const createSchemaMutate = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCatalog: () => ({ exerciseById: new Map() }),
    useCreateSchema: () => ({ mutate: createSchemaMutate, isPending: false }),
    useUpdateSchema: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock("../lib/use-create-parallel-schemas", () => ({
  useCreateParallelSchemas: () => ({ run: vi.fn(), isPending: false }),
}));

vi.mock("../lib/use-create-independent-ladders", () => ({
  useCreateIndependentLadders: () => ({ run: vi.fn(), isPending: false }),
}));

const { AddSubSchemaButton } = await import("./add-sub-schema-button");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const PARENT_SCHEMA_ID = "clp9z8x7w0000abcd1234psc1";
const BUTTON_LABEL = "Add sub-schema";

const renderButton = () =>
  render(
    <AddSubSchemaButton
      planId={PLAN_ID}
      startDate={START_DATE}
      blockId={BLOCK_ID}
      parentSchemaId={PARENT_SCHEMA_ID}
    />,
  );

afterEach(() => {
  createSchemaMutate.mockReset();
});

describe("AddSubSchemaButton", () => {
  it("renders the trigger and keeps the modal closed until clicked", () => {
    renderButton();

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the create AxisEditorModal when the trigger is clicked", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));

    expect(screen.getByRole("dialog", { name: "Add schema" })).toBeInTheDocument();
  });

  it("submits createSchema carrying parentSchemaId and blockId", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Count" }));
    fireEvent.click(screen.getByRole("button", { name: "Add schema" }));

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      parentSchemaId: PARENT_SCHEMA_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      notes: null,
    });
  });
});
