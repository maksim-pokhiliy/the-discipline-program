import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateSchemaState = { isPending: false };
const deleteSchemaState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateSchema: () => ({ mutate: vi.fn(), isPending: updateSchemaState.isPending }),
    useDeleteSchema: () => ({ mutate: vi.fn(), isPending: deleteSchemaState.isPending }),
  };
});

vi.mock("./schema-row-list", () => ({
  SchemaRowList: () => <div data-testid="schema-row-list-mock" />,
}));

const { GroupTrackWrapper } = await import("./group-track-wrapper");
const { SchemaCard } = await import("./schema-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const DRAG_HANDLE_ARIA = "Drag schema";
const RAIL_CONTINUATION_TOP_PX = "-8px";
const RAIL_FIRST_TOP = "0";

const makeMember = (id: string): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: GROUP_ID,
    order: 1,
    header: null,
    intensity: null,
    composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  rowGroups: [],
});

type RenderOptions = {
  index?: number;
  isContinuation?: boolean;
  member?: SchemaWithBody;
};

const renderWrapper = ({
  index = 0,
  isContinuation = false,
  member = makeMember("clp9z8x7w0000abcd1234mm01"),
}: RenderOptions = {}): HTMLElement => {
  const { container } = render(
    <GroupTrackWrapper
      member={member}
      index={index}
      isContinuation={isContinuation}
      planId={PLAN_ID}
      startDate={START_DATE}
      parentIsReorderPending={false}
    />,
  );

  const wrapper = container.firstElementChild;

  if (!(wrapper instanceof HTMLElement)) {
    throw new Error("GroupTrackWrapper did not render a root element");
  }

  return wrapper;
};

const railBeforeTop = (wrapper: HTMLElement): string | null => {
  const emotionClass = Array.from(wrapper.classList).find((cls) => cls.startsWith("css-"));

  if (emotionClass === undefined) {
    throw new Error("wrapper carries no emotion class");
  }

  const cssText = Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("\n");

  const beforeRule = new RegExp(`\\.${emotionClass}::before\\{([^}]*)\\}`).exec(cssText);

  if (beforeRule === null) {
    return null;
  }

  const topDeclaration = /(?:^|;)top:([^;]+)/.exec(beforeRule[1] ?? "");

  return topDeclaration?.[1] ?? null;
};

afterEach(() => {
  updateSchemaState.isPending = false;
  deleteSchemaState.isPending = false;
});

describe("GroupTrackWrapper track badge (QA-107)", () => {
  it("renders the 1-based numbered badge with a 'Track N' tooltip for the first track", () => {
    renderWrapper({ index: 0 });

    const badge = screen.getByLabelText("Track 1");

    expect(badge).toHaveTextContent("1");
  });

  it("renders the 1-based numbered badge with a 'Track N' tooltip for a later track", () => {
    renderWrapper({ index: 2 });

    const badge = screen.getByLabelText("Track 3");

    expect(badge).toHaveTextContent("3");
  });
});

describe("GroupTrackWrapper member card has no drag handle (QA-107, proto no-member-handle law)", () => {
  it("renders the boxed member SchemaCard without the 'Drag schema' handle", () => {
    renderWrapper();

    expect(screen.queryByRole("button", { name: DRAG_HANDLE_ARIA })).toBeNull();
  });

  it("keeps the 'Drag schema' handle on a standalone SchemaCard (the handle the box omits)", () => {
    render(
      <SchemaCard
        schema={makeMember("clp9z8x7w0000abcd1234mm09")}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.getByRole("button", { name: DRAG_HANDLE_ARIA })).toBeInTheDocument();
  });
});

describe("GroupTrackWrapper continuous accent rail (QA-107)", () => {
  it("starts the rail at the top edge for the first track (no upward continuation offset)", () => {
    const wrapper = renderWrapper({ index: 0, isContinuation: false });

    expect(railBeforeTop(wrapper)).toBe(RAIL_FIRST_TOP);
  });

  it("extends the rail upward across the inter-track gap for a continuation track", () => {
    const wrapper = renderWrapper({ index: 1, isContinuation: true });

    expect(railBeforeTop(wrapper)).toBe(RAIL_CONTINUATION_TOP_PX);
  });
});
