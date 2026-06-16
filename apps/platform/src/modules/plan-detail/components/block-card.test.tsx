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

vi.mock("../lib/use-create-schema-group", () => ({
  useCreateSchemaGroup: () => ({ run: () => Promise.resolve(), isPending: false }),
}));

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
    groupId: null,
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
  rowGroups: [],
});

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 1,
  notes: null,
  labels: [],
  schemas: [],
  groups: [],
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

const getNoteInputs = (): (HTMLInputElement | HTMLTextAreaElement)[] =>
  screen
    .queryAllByRole("textbox", { name: /^Block notes/ })
    .filter(
      (el): el is HTMLInputElement | HTMLTextAreaElement =>
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    );

const expandBlock = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Expand block" }));
};

const noteFieldRoot = (): HTMLElement => {
  const root = getNoteInputs()[0]?.closest(".MuiBox-root");

  if (!(root instanceof HTMLElement)) {
    throw new Error("expected the NotesListField root for Block notes");
  }

  return root;
};

const blurNoteField = (): void => {
  fireEvent.blur(noteFieldRoot(), { relatedTarget: document.body });
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

  it("renders the head, note and body sections in order", () => {
    renderBlockCard({ block: makeBlock({ schemas: [makeSchema()], notes: ["cue"] }) });

    expandBlock();

    const dragBtn = screen.getByRole("button", { name: "Drag block" });
    const noteAnchor = getNoteInputs()[0];
    const schemaCardMock = screen.getByTestId("schema-card-mock");

    if (noteAnchor === undefined) {
      throw new Error("note input missing");
    }

    const sectionOrder = [dragBtn, noteAnchor, schemaCardMock];

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

  it("opens the picker listing the level options when the '+ label' trigger is clicked", () => {
    const strength = makeLabel({ id: "lab-1", name: "STRENGTH" });
    const skill = makeLabel({ id: "lab-2", name: "SKILL" });
    const accessory = makeLabel({ id: "lab-3", name: "ACCESSORY" });

    renderBlockCard({
      block: makeBlock({ labels: [strength] }),
      blockOptions: [strength, skill, accessory],
    });

    fireEvent.click(screen.getByLabelText("Add block label"));
    fireEvent.mouseDown(screen.getByRole("combobox"));

    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByRole("option", { name: "SKILL" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "ACCESSORY" })).toBeInTheDocument();
  });

  it("fires useAssignBlockLabels with [...currentIds, newId] when an option is selected", () => {
    const strength = makeLabel({ id: "lab-1", name: "STRENGTH" });
    const skill = makeLabel({ id: "lab-2", name: "SKILL" });

    renderBlockCard({
      block: makeBlock({ labels: [strength] }),
      blockOptions: [strength, skill],
    });

    fireEvent.click(screen.getByLabelText("Add block label"));
    fireEvent.mouseDown(screen.getByRole("combobox"));

    const listbox = screen.getByRole("listbox");

    fireEvent.click(within(listbox).getByRole("option", { name: "SKILL" }));

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

describe("BlockCard note row", () => {
  it("renders the note row without an add-note affordance and no rows when block.notes === null", () => {
    renderBlockCard();

    expandBlock();

    expect(screen.queryByRole("button", { name: "add note" })).toBeNull();
    expect(getNoteInputs()).toHaveLength(0);
  });

  it("fires useUpdateBlock with the edited multi-note list on focus-leave (W4R-005)", () => {
    renderBlockCard({ block: makeBlock({ notes: ["old one", "old two"] }) });

    expandBlock();

    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "focus on bar path" } });
    fireEvent.change(getNoteInputs()[1] as HTMLElement, { target: { value: "brace hard" } });
    blurNoteField();

    expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    expect(updateBlockMutate).toHaveBeenCalledWith({
      blockId: BLOCK_ID,
      data: { notes: ["focus on bar path", "brace hard"] },
    });
  });

  it("reopens a stored multi-note list as separate rows without collapsing", () => {
    renderBlockCard({ block: makeBlock({ notes: ["cue one", "cue two"] }) });

    expandBlock();

    const inputs = getNoteInputs();

    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.value).toBe("cue one");
    expect(inputs[1]?.value).toBe("cue two");
  });

  it("fires useUpdateBlock with { data: { notes: null } } when the only note is cleared", () => {
    renderBlockCard({ block: makeBlock({ notes: ["previous note"] }) });

    expandBlock();

    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "" } });
    blurNoteField();

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

    expandBlock();

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
  it("opens the ConfirmationModal when the Delete IconButton is clicked and fires useDeleteBlock on confirm", () => {
    renderBlockCard();

    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(screen.getByRole("heading", { name: "Delete block" })).toBeInTheDocument();
    expect(screen.getByText("Delete this block?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteBlockMutate).toHaveBeenCalledTimes(1);
    expect(deleteBlockMutate.mock.calls[0]?.[0]).toEqual({ blockId: BLOCK_ID });
  });

  it("disables the drag IconButton, Delete and the LabelPickerChip trigger when any mutation is pending", () => {
    updateBlockState.isPending = true;

    renderBlockCard({ blockOptions: [makeLabel({ id: "lab-1", name: "STRENGTH" })] });

    expect(screen.getByRole("button", { name: "Drag block" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete block" })).toBeDisabled();
    expect(screen.getByLabelText("Add block label")).toBeDisabled();
  });

  describe.each([
    { name: "useUpdateBlock", flip: () => (updateBlockState.isPending = true) },
    { name: "useDeleteBlock", flip: () => (deleteBlockState.isPending = true) },
    { name: "useAssignBlockLabels", flip: () => (assignLabelsState.isPending = true) },
  ])("isMutationPending derived from $name (QA-014)", ({ flip }) => {
    it("disables drag IconButton, Delete and the LabelPickerChip trigger", () => {
      flip();

      renderBlockCard({ blockOptions: [makeLabel({ id: "lab-1", name: "STRENGTH" })] });

      expect(screen.getByRole("button", { name: "Drag block" })).toBeDisabled();
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

  it("disables Delete and LabelPickerChip trigger when isReorderPending is true", () => {
    renderBlockCard({
      isReorderPending: true,
      blockOptions: [makeLabel({ id: "lab-1", name: "STRENGTH" })],
    });

    expect(screen.getByRole("button", { name: "Delete block" })).toBeDisabled();
    expect(screen.getByLabelText("Add block label")).toBeDisabled();
  });

  it("passes effective pending down to SchemaCard via BlockCardBody when isReorderPending is true", () => {
    renderBlockCard({
      block: makeBlock({ schemas: [makeSchema()] }),
      isReorderPending: true,
    });

    expandBlock();

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "true");
  });

  it("passes data-parent-pending='false' to SchemaCard when isReorderPending is false", () => {
    renderBlockCard({ block: makeBlock({ schemas: [makeSchema()] }) });

    expandBlock();

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});
