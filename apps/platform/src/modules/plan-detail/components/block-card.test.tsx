import { createElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";
import type { Label } from "@repo/contracts/lms/label";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { CatalogContext, type CatalogContextValue } from "@app/lib/contexts/catalog-provider";
import {
  LabelOptionsContext,
  type LabelOptionsContextValue,
} from "@app/lib/contexts/label-options-provider";
import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateBlockMutate = vi.fn();
const deleteBlockMutate = vi.fn();
const assignLabelsMutate = vi.fn();
const reorderSchemasMutate = vi.fn();
const updateBlockState = { isPending: false };
const deleteBlockState = { isPending: false };
const assignLabelsState = { isPending: false };
const reorderSchemasState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateBlock: () => ({
      mutate: updateBlockMutate,
      isPending: updateBlockState.isPending,
    }),
    useDeleteBlock: () => ({
      mutate: deleteBlockMutate,
      isPending: deleteBlockState.isPending,
    }),
    useAssignBlockLabels: () => ({
      mutate: assignLabelsMutate,
      isPending: assignLabelsState.isPending,
    }),
    useReorderSchemas: () => ({
      mutate: reorderSchemasMutate,
      isPending: reorderSchemasState.isPending,
    }),
  };
});

vi.mock("./schema-card", () => ({
  SchemaCard: ({
    schema,
    parentIsReorderPending,
  }: {
    schema: SchemaWithBody;
    parentIsReorderPending?: boolean;
  }) => (
    <div
      data-testid="schema-card-mock"
      data-schema-id={schema.schema.id}
      data-parent-pending={parentIsReorderPending === true ? "true" : "false"}
    >{`schema-card:${schema.schema.id}`}</div>
  ),
}));

vi.mock("./block-editor-modal", () => {
  const renderEditorMock = (props: { open: boolean }) =>
    props.open ? createElement("div", { "data-testid": "block-editor-modal-mock" }) : null;

  return { BlockEditorModal: renderEditorMock };
});

vi.mock("./add-schema-button", () => {
  const renderAddSchemaButtonMock = () =>
    createElement("div", { "data-testid": "add-schema-button-mock" });

  return { AddSchemaButton: renderAddSchemaButtonMock };
});

const { BlockCard } = await import("./block-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const NOW = new Date("2025-01-01T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";

const makeLabel = (overrides: Partial<Label> = {}): Label => ({
  id: "clp9z8x7w0000abcd1234lab1",
  name: "STRENGTH",
  nameLower: "strength",
  applicableLevels: ["BLOCK"],
  notes: null,
  rest: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeSchema = (overrides: Partial<SchemaWithBody["schema"]> = {}): SchemaWithBody => ({
  schema: {
    id: "clp9z8x7w0000abcd1234sch1",
    blockId: BLOCK_ID,
    parentSchemaId: null,
    order: 1,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  },
  rows: [],
  subSchemas: [],
});

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 1,
  intensity: null,
  timeCap: null,
  notes: null,
  labels: [],
  schemas: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

type RenderOptions = {
  block?: Block;
  blockOptions?: Label[];
  isReorderPending?: boolean;
};

const renderBlockCard = ({
  block = makeBlock(),
  blockOptions = [],
  isReorderPending = false,
}: RenderOptions = {}) => {
  const ctxValue: LabelOptionsContextValue = {
    DAY: { options: [], isLoading: false },
    SESSION: { options: [], isLoading: false },
    BLOCK: { options: blockOptions, isLoading: false },
  };

  const catalogValue: CatalogContextValue = {
    exerciseById: new Map(),
  };

  return render(
    <LabelOptionsContext.Provider value={ctxValue}>
      <CatalogContext.Provider value={catalogValue}>
        <BlockCard
          block={block}
          planId={PLAN_ID}
          startDate={START_DATE}
          isReorderPending={isReorderPending}
        />
      </CatalogContext.Provider>
    </LabelOptionsContext.Provider>,
  );
};

const getNotesInput = (): HTMLInputElement | HTMLTextAreaElement => {
  const el = screen.getByRole("textbox", { name: "Block notes" });

  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) {
    throw new Error("expected an input/textarea element for Block notes");
  }

  return el;
};

afterEach(() => {
  updateBlockState.isPending = false;
  deleteBlockState.isPending = false;
  assignLabelsState.isPending = false;
  reorderSchemasState.isPending = false;
  updateBlockMutate.mockReset();
  deleteBlockMutate.mockReset();
  assignLabelsMutate.mockReset();
  reorderSchemasMutate.mockReset();
});

describe("BlockCard chrome", () => {
  it("renders the outer card with border and radius via Stack column shell", () => {
    const { container } = renderBlockCard();
    const shell = container.querySelector(".MuiStack-root");

    expect(shell).not.toBeNull();
    expect(shell).toHaveStyle({ flexDirection: "column" });
  });

  it("renders all four sections (head, meta, note, body) in order", () => {
    renderBlockCard({ block: makeBlock({ schemas: [makeSchema()] }) });

    const dragBtn = screen.getByRole("button", { name: "Drag block" });
    const metaPlaceholder = screen.getByText("no intensity / cap set");
    const noteInput = getNotesInput();
    const schemaCardMock = screen.getByTestId("schema-card-mock");

    const sectionOrder = [dragBtn, metaPlaceholder, noteInput, schemaCardMock];

    for (let i = 0; i < sectionOrder.length - 1; i += 1) {
      const earlier = sectionOrder[i];
      const later = sectionOrder[i + 1];

      if (earlier === undefined || later === undefined) {
        throw new Error("section reference missing");
      }

      const relation = earlier.compareDocumentPosition(later);

      expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    }
  });

  it("renders the drag IconButton with grab cursor, touchAction:none and aria 'Drag block'", () => {
    renderBlockCard();

    const dragBtn = screen.getByRole("button", { name: "Drag block" });

    expect(dragBtn).toBeInTheDocument();
    expect(dragBtn).toHaveStyle({ cursor: "grab", touchAction: "none" });
  });
});

describe("BlockCard multi-label", () => {
  it("renders one BlockLabel per label in block.labels plus the '+ label' trigger", () => {
    const strength = makeLabel({ id: "lab-1", name: "STRENGTH" });
    const skill = makeLabel({ id: "lab-2", name: "SKILL" });
    const accessory = makeLabel({ id: "lab-3", name: "ACCESSORY" });

    renderBlockCard({
      block: makeBlock({ labels: [strength, skill] }),
      blockOptions: [strength, skill, accessory],
    });

    expect(screen.getByText("STRENGTH")).toBeInTheDocument();
    expect(screen.getByText("SKILL")).toBeInTheDocument();
    expect(screen.getByLabelText("Add block label")).toBeInTheDocument();
  });

  it("opens the menu listing only unselected options when the '+ label' trigger is clicked", () => {
    const strength = makeLabel({ id: "lab-1", name: "STRENGTH" });
    const skill = makeLabel({ id: "lab-2", name: "SKILL" });
    const accessory = makeLabel({ id: "lab-3", name: "ACCESSORY" });

    renderBlockCard({
      block: makeBlock({ labels: [strength] }),
      blockOptions: [strength, skill, accessory],
    });

    fireEvent.click(screen.getByLabelText("Add block label"));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");

    expect(items).toHaveLength(2);
    expect(within(menu).getByText("SKILL")).toBeInTheDocument();
    expect(within(menu).getByText("ACCESSORY")).toBeInTheDocument();
    expect(within(menu).queryByText("STRENGTH")).toBeNull();
  });

  it("fires useAssignBlockLabels with [...currentIds, newId] when a menu option is selected", () => {
    const strength = makeLabel({ id: "lab-1", name: "STRENGTH" });
    const skill = makeLabel({ id: "lab-2", name: "SKILL" });

    renderBlockCard({
      block: makeBlock({ labels: [strength] }),
      blockOptions: [strength, skill],
    });

    fireEvent.click(screen.getByLabelText("Add block label"));
    fireEvent.click(screen.getByRole("menuitem", { name: "SKILL" }));

    expect(assignLabelsMutate).toHaveBeenCalledTimes(1);
    expect(assignLabelsMutate).toHaveBeenCalledWith({
      blockId: BLOCK_ID,
      data: { labelIds: ["lab-1", "lab-2"] },
    });
  });

  it("fires useAssignBlockLabels with the filtered id list when a BlockLabel onDelete is clicked", () => {
    const strength = makeLabel({ id: "lab-1", name: "STRENGTH" });
    const skill = makeLabel({ id: "lab-2", name: "SKILL" });
    const { container } = renderBlockCard({
      block: makeBlock({ labels: [strength, skill] }),
      blockOptions: [strength, skill],
    });

    const firstDeleteIcon = container.querySelector(".MuiChip-deleteIcon");

    expect(firstDeleteIcon).not.toBeNull();

    if (firstDeleteIcon === null) {
      throw new Error("first chip deleteIcon missing");
    }

    fireEvent.click(firstDeleteIcon);

    expect(assignLabelsMutate).toHaveBeenCalledTimes(1);
    expect(assignLabelsMutate).toHaveBeenCalledWith({
      blockId: BLOCK_ID,
      data: { labelIds: ["lab-2"] },
    });
  });
});

describe("BlockCard meta row", () => {
  it("renders the muted 'no intensity / cap set' placeholder when both intensity and timeCap are null", () => {
    renderBlockCard();

    expect(screen.getByText("no intensity / cap set")).toBeInTheDocument();
  });

  it("renders one IndicatorChip per intensity dimension (effortPercent.value → primary, rpe → info)", () => {
    const block = makeBlock({
      intensity: {
        effortPercent: { value: 75 },
        rpe: { value: 8 },
      },
    });
    const { container } = renderBlockCard({ block });

    const effortChip = screen.getByText("@ 75%");
    const rpeChip = screen.getByText("RPE 8");
    const effortRoot = effortChip.closest(".MuiChip-root");
    const rpeRoot = rpeChip.closest(".MuiChip-root");

    expect(effortRoot).not.toBeNull();
    expect(rpeRoot).not.toBeNull();
    expect(effortRoot).toHaveClass("MuiChip-colorPrimary");
    expect(rpeRoot).toHaveClass("MuiChip-colorInfo");

    const chips = container.querySelectorAll(".MuiChip-root");

    expect(chips.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the cap chip 'cap 5:00' when timeCap is {min:5, unit:'min'} with no max", () => {
    renderBlockCard({ block: makeBlock({ timeCap: { min: 5, unit: "min" } }) });

    expect(screen.getByText("cap 5:00")).toBeInTheDocument();
  });

  it("renders the cap range 'cap 5:00–10:00' when timeCap has max", () => {
    renderBlockCard({ block: makeBlock({ timeCap: { min: 5, max: 10, unit: "min" } }) });

    expect(screen.getByText("cap 5:00–10:00")).toBeInTheDocument();
  });

  it("renders the cascade-note 'cascades to schemas ↧' unconditionally inside the meta row", () => {
    renderBlockCard();

    expect(screen.getByText("cascades to schemas ↧")).toBeInTheDocument();
  });
});

describe("BlockCard note row", () => {
  it("renders the note row always with placeholder copy when block.notes === null", () => {
    renderBlockCard();

    const input = getNotesInput();

    expect(input).toHaveAttribute("placeholder", "block notes — coaching cues, intent…");
    expect(input.value).toBe("");
  });

  it("fires useUpdateBlock with { data: { notes: <value> } } when a non-empty value is committed", () => {
    renderBlockCard();

    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "focus on bar path" } });
    fireEvent.blur(input);

    expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    expect(updateBlockMutate).toHaveBeenCalledWith({
      blockId: BLOCK_ID,
      data: { notes: "focus on bar path" },
    });
  });

  it("fires useUpdateBlock with { data: { notes: null } } when an empty string is committed", () => {
    renderBlockCard({ block: makeBlock({ notes: "previous note" }) });

    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    expect(updateBlockMutate).toHaveBeenCalledWith({
      blockId: BLOCK_ID,
      data: { notes: null },
    });
  });
});

describe("BlockCard body / schema rendering", () => {
  it("renders every block schema as a flat SchemaCard in declared order", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1" });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2" });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd1234sch3" });

    renderBlockCard({ block: makeBlock({ schemas: [s1, s2, s3] }) });

    const schemaCards = screen.getAllByTestId("schema-card-mock");

    expect(schemaCards).toHaveLength(3);
    expect(schemaCards.map((node) => node.getAttribute("data-schema-id"))).toEqual([
      s1.schema.id,
      s2.schema.id,
      s3.schema.id,
    ]);
  });
});

describe("BlockCard mutation pending / actions", () => {
  it("opens the BlockEditorModal when the Tune IconButton is clicked", () => {
    renderBlockCard();

    expect(screen.queryByTestId("block-editor-modal-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Edit block details" }));

    expect(screen.getByTestId("block-editor-modal-mock")).toBeInTheDocument();
  });

  it("opens the ConfirmationModal when the Delete IconButton is clicked and fires useDeleteBlock on confirm", () => {
    renderBlockCard();

    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(screen.getByRole("heading", { name: "Delete block" })).toBeInTheDocument();
    expect(screen.getByText("Delete this block?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteBlockMutate).toHaveBeenCalledTimes(1);
    expect(deleteBlockMutate.mock.calls[0]?.[0]).toEqual({ blockId: BLOCK_ID });
  });

  it("disables the drag IconButton, Tune, Delete and the LabelPickerChip trigger when any mutation is pending", () => {
    updateBlockState.isPending = true;

    renderBlockCard({ blockOptions: [makeLabel({ id: "lab-1", name: "STRENGTH" })] });

    expect(screen.getByRole("button", { name: "Drag block" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit block details" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete block" })).toBeDisabled();
    expect(screen.getByLabelText("Add block label")).toBeDisabled();
  });

  describe.each([
    { name: "useUpdateBlock", flip: () => (updateBlockState.isPending = true) },
    { name: "useDeleteBlock", flip: () => (deleteBlockState.isPending = true) },
    { name: "useAssignBlockLabels", flip: () => (assignLabelsState.isPending = true) },
  ])("isMutationPending derived from $name (QA-014)", ({ flip }) => {
    it("disables drag IconButton, Tune, Delete and the LabelPickerChip trigger", () => {
      flip();

      renderBlockCard({ blockOptions: [makeLabel({ id: "lab-1", name: "STRENGTH" })] });

      expect(screen.getByRole("button", { name: "Drag block" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Edit block details" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Delete block" })).toBeDisabled();
      expect(screen.getByLabelText("Add block label")).toBeDisabled();
    });
  });

  it("keeps the ConfirmationModal mounted when useDeleteBlock surfaces an error path (no onSuccess fires)", () => {
    deleteBlockMutate.mockImplementation(() => undefined);

    renderBlockCard();

    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(screen.getByRole("heading", { name: "Delete block" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteBlockMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Delete block" })).toBeInTheDocument();
    expect(screen.getByText("Delete this block?")).toBeInTheDocument();
  });
});

describe("BlockCard isReorderPending cascade (D-10)", () => {
  it("defaults isReorderPending to false when prop is omitted", () => {
    renderBlockCard();

    expect(screen.getByRole("button", { name: "Drag block" })).not.toBeDisabled();
  });

  it("disables the drag IconButton when isReorderPending is true", () => {
    renderBlockCard({ isReorderPending: true });

    expect(screen.getByRole("button", { name: "Drag block" })).toBeDisabled();
  });

  it("disables Tune, Delete and LabelPickerChip trigger when isReorderPending is true", () => {
    renderBlockCard({
      isReorderPending: true,
      blockOptions: [makeLabel({ id: "lab-1", name: "STRENGTH" })],
    });

    expect(screen.getByRole("button", { name: "Edit block details" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete block" })).toBeDisabled();
    expect(screen.getByLabelText("Add block label")).toBeDisabled();
  });

  it("passes effective pending down to SchemaCard via BlockCardBody when isReorderPending is true", () => {
    renderBlockCard({
      block: makeBlock({ schemas: [makeSchema()] }),
      isReorderPending: true,
    });

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "true");
  });

  it("passes data-parent-pending='false' to SchemaCard when isReorderPending is false", () => {
    renderBlockCard({ block: makeBlock({ schemas: [makeSchema()] }) });

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});
