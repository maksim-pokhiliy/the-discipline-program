import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";
import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";

import {
  LabelOptionsContext,
  type LabelOptionsContextValue,
} from "@app/lib/contexts/label-options-provider";
import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateSessionMutate = vi.fn();
const deleteSessionMutate = vi.fn();
const updateSessionState = { isPending: false };
const deleteSessionState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateSession: () => ({
      mutate: updateSessionMutate,
      isPending: updateSessionState.isPending,
    }),
    useDeleteSession: () => ({
      mutate: deleteSessionMutate,
      isPending: deleteSessionState.isPending,
    }),
  };
});

vi.mock("./block-list", () => ({
  BlockList: ({
    blocks,
    parentIsReorderPending,
  }: {
    blocks: Block[];
    parentIsReorderPending?: boolean;
  }) => (
    <div
      data-testid="block-list-mock"
      data-parent-pending={parentIsReorderPending === true ? "true" : "false"}
    >{`BlockList: ${String(blocks.length)} blocks`}</div>
  ),
}));

const { SessionCard } = await import("./session-card");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00Z");

const makeLabel = (overrides: Partial<Label> = {}): Label => ({
  id: "clp9z8x7w0000abcd1234lab1",
  name: "STRENGTH",
  nameLower: "strength",
  applicableLevels: ["SESSION"],
  notes: null,
  rest: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: "clp9z8x7w0000abcd1234blk1",
  sessionId: "clp9z8x7w0000abcd1234ses1",
  order: 1,
  notes: null,
  labels: [],
  schemas: [],
  groups: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeSession = (overrides: Partial<SessionWithLabel> = {}): SessionWithLabel => ({
  id: "clp9z8x7w0000abcd1234ses1",
  dayId: "clp9z8x7w0000abcd1234day1",
  order: 1,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  label: null,
  blocks: [],
  ...overrides,
});

type RenderOptions = {
  session?: SessionWithLabel;
  sessionOptions?: Label[];
  isReorderPending?: boolean;
};

const renderSessionCard = ({
  session = makeSession(),
  sessionOptions = [],
  isReorderPending = false,
}: RenderOptions = {}) => {
  const ctxValue: LabelOptionsContextValue = {
    DAY: { options: [], isLoading: false },
    SESSION: { options: sessionOptions, isLoading: false },
    BLOCK: { options: [], isLoading: false },
  };

  return render(
    <LabelOptionsContext.Provider value={ctxValue}>
      <SessionCard
        session={session}
        planId={PLAN_ID}
        startDate={START_DATE}
        isReorderPending={isReorderPending}
      />
    </LabelOptionsContext.Provider>,
  );
};

const getNoteInputs = (): (HTMLInputElement | HTMLTextAreaElement)[] =>
  screen
    .queryAllByRole("textbox", { name: /^Session notes/ })
    .filter(
      (el): el is HTMLInputElement | HTMLTextAreaElement =>
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    );

const addNoteButton = (): HTMLElement => screen.getByRole("button", { name: "add note" });

const blurNoteField = (): void => {
  const root = addNoteButton().closest(".MuiBox-root");

  if (!(root instanceof HTMLElement)) {
    throw new Error("expected the NotesListField root for Session notes");
  }

  fireEvent.blur(root, { relatedTarget: document.body });
};

describe("SessionCard", () => {
  afterEach(() => {
    updateSessionState.isPending = false;
    deleteSessionState.isPending = false;
  });

  it("renders the head row with the chevron and BlockList visible by default (isExpanded=true)", () => {
    renderSessionCard({ session: makeSession({ blocks: [makeBlock()] }) });

    expect(screen.getByRole("button", { name: "Collapse session" })).toBeInTheDocument();
    expect(screen.getByTestId("block-list-mock")).toHaveTextContent("BlockList: 1 blocks");
  });

  it("collapses on chevron click and hides the BlockList while keeping the head row", () => {
    renderSessionCard({ session: makeSession({ blocks: [makeBlock()] }) });

    fireEvent.click(screen.getByRole("button", { name: "Collapse session" }));

    expect(screen.queryByTestId("block-list-mock")).toBeNull();
    expect(screen.getByRole("button", { name: "Expand session" })).toBeInTheDocument();
  });

  it("expands again on a second chevron click and re-renders the BlockList", () => {
    renderSessionCard({ session: makeSession({ blocks: [makeBlock()] }) });

    fireEvent.click(screen.getByRole("button", { name: "Collapse session" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand session" }));

    expect(screen.getByTestId("block-list-mock")).toBeInTheDocument();
  });

  it('renders "N blocks" plural collapsed-stats when collapsed and blocks.length > 1', () => {
    renderSessionCard({
      session: makeSession({
        blocks: [makeBlock({ id: "b1" }), makeBlock({ id: "b2" }), makeBlock({ id: "b3" })],
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Collapse session" }));

    expect(screen.getByText("3 blocks")).toBeInTheDocument();
  });

  it('renders "1 block" singular collapsed-stats when collapsed and blocks.length === 1', () => {
    renderSessionCard({ session: makeSession({ blocks: [makeBlock()] }) });

    fireEvent.click(screen.getByRole("button", { name: "Collapse session" }));

    expect(screen.getByText("1 block")).toBeInTheDocument();
  });

  it("hides collapsed-stats when expanded even if blocks are present", () => {
    renderSessionCard({
      session: makeSession({ blocks: [makeBlock({ id: "b1" }), makeBlock({ id: "b2" })] }),
    });

    expect(screen.queryByText("2 blocks")).toBeNull();
  });

  it("hides collapsed-stats when collapsed but blocks.length === 0", () => {
    renderSessionCard({ session: makeSession({ blocks: [] }) });

    fireEvent.click(screen.getByRole("button", { name: "Collapse session" }));

    expect(screen.queryByText(/blocks?$/)).toBeNull();
  });

  it("fires useUpdateSession.mutate with the selected option id when a label is picked", () => {
    updateSessionMutate.mockClear();
    const strength = makeLabel({ name: "STRENGTH" });
    const recovery = makeLabel({ id: "clp9z8x7w0000abcd1234lab2", name: "RECOVERY" });
    const session = makeSession({ labelId: strength.id, label: strength });

    renderSessionCard({ session, sessionOptions: [strength, recovery] });

    fireEvent.click(screen.getByRole("button", { name: "Session label" }));

    const menu = screen.getByRole("menu");

    fireEvent.click(within(menu).getByText("RECOVERY"));

    expect(updateSessionMutate).toHaveBeenCalledTimes(1);
    expect(updateSessionMutate).toHaveBeenCalledWith({
      sessionId: session.id,
      data: { labelId: recovery.id },
    });
  });

  it("fires useUpdateSession.mutate with the authored multi-note list on focus-leave (W4R-005)", () => {
    updateSessionMutate.mockClear();

    renderSessionCard();

    fireEvent.click(addNoteButton());
    fireEvent.change(getNoteInputs()[0] as HTMLElement, {
      target: { value: "  focus on bar path  " },
    });
    fireEvent.click(addNoteButton());
    fireEvent.change(getNoteInputs()[1] as HTMLElement, { target: { value: "~ 45 min" } });
    blurNoteField();

    expect(updateSessionMutate).toHaveBeenCalledTimes(1);
    expect(updateSessionMutate).toHaveBeenCalledWith({
      sessionId: "clp9z8x7w0000abcd1234ses1",
      data: { notes: ["focus on bar path", "~ 45 min"] },
    });
  });

  it("reopens a stored multi-note session list as separate rows without collapsing", () => {
    renderSessionCard({ session: makeSession({ notes: ["cue one", "cue two"] }) });

    const inputs = getNoteInputs();

    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.value).toBe("cue one");
    expect(inputs[1]?.value).toBe("cue two");
  });

  it("commits null instead of an empty list when the only session note is cleared on focus-leave", () => {
    updateSessionMutate.mockClear();

    renderSessionCard({ session: makeSession({ notes: ["previous note"] }) });

    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "" } });
    blurNoteField();

    expect(updateSessionMutate).toHaveBeenCalledTimes(1);
    expect(updateSessionMutate).toHaveBeenCalledWith({
      sessionId: "clp9z8x7w0000abcd1234ses1",
      data: { notes: null },
    });
  });

  it("opens the ConfirmationModal when the Delete IconButton is clicked", () => {
    renderSessionCard();

    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));

    expect(screen.getByRole("heading", { name: "Delete session" })).toBeInTheDocument();
    expect(screen.getByText("Delete this session?")).toBeInTheDocument();
  });

  it("fires useDeleteSession.mutate with { sessionId } when Delete is confirmed in the modal", () => {
    deleteSessionMutate.mockClear();
    const session = makeSession();

    renderSessionCard({ session });

    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSessionMutate).toHaveBeenCalledTimes(1);
    expect(deleteSessionMutate.mock.calls[0]?.[0]).toEqual({ sessionId: session.id });
  });

  it("renders delete-confirm details with start date and label-or-empty fallback", () => {
    const strength = makeLabel({ name: "STRENGTH" });
    const { unmount } = renderSessionCard({
      session: makeSession({ labelId: strength.id, label: strength }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));

    expect(screen.getByText(`${START_DATE} · STRENGTH`)).toBeInTheDocument();

    unmount();

    renderSessionCard({ session: makeSession({ label: null }) });

    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));

    expect(screen.getByText(`${START_DATE} · Empty session`)).toBeInTheDocument();
  });

  it("disables the drag IconButton when useUpdateSession is pending (Q-2)", () => {
    updateSessionState.isPending = true;

    renderSessionCard();

    expect(screen.getByRole("button", { name: "Drag session" })).toBeDisabled();
  });

  it("renders the LabelPickerChip as non-interactive when sessionOptions is empty and a value is set (Q-9)", () => {
    const strength = makeLabel({ name: "STRENGTH" });
    const session = makeSession({ labelId: strength.id, label: strength });

    renderSessionCard({ session, sessionOptions: [] });

    fireEvent.click(screen.getByLabelText("Session label"));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("wires maxLength=2000 on each notes input from SESSION_CONSTANTS (Q-10)", () => {
    renderSessionCard();

    fireEvent.click(addNoteButton());

    expect(getNoteInputs()[0]).toHaveAttribute("maxlength", "2000");
  });

  it("commits null on focus-leave when only whitespace remains over a non-empty prior note (Q-4)", () => {
    updateSessionMutate.mockClear();

    renderSessionCard({ session: makeSession({ notes: ["RPE 9 focus"] }) });

    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "   " } });
    blurNoteField();

    expect(updateSessionMutate).toHaveBeenCalledTimes(1);
    expect(updateSessionMutate).toHaveBeenCalledWith({
      sessionId: "clp9z8x7w0000abcd1234ses1",
      data: { notes: null },
    });
  });

  it("disables the Delete IconButton while useDeleteSession is pending (Q-11)", () => {
    deleteSessionState.isPending = true;

    renderSessionCard();

    expect(screen.getByRole("button", { name: "Delete session" })).toBeDisabled();
  });
});

describe("SessionCard isReorderPending cascade (D-10)", () => {
  afterEach(() => {
    updateSessionState.isPending = false;
    deleteSessionState.isPending = false;
  });

  it("defaults isReorderPending to false when prop is omitted", () => {
    renderSessionCard();

    expect(screen.getByRole("button", { name: "Drag session" })).not.toBeDisabled();
  });

  it("disables the drag IconButton when isReorderPending is true", () => {
    renderSessionCard({ isReorderPending: true });

    expect(screen.getByRole("button", { name: "Drag session" })).toBeDisabled();
  });

  it("disables the Delete IconButton when isReorderPending is true", () => {
    renderSessionCard({ isReorderPending: true });

    expect(screen.getByRole("button", { name: "Delete session" })).toBeDisabled();
  });

  it("passes effective pending down to BlockList when isReorderPending is true", () => {
    renderSessionCard({
      session: makeSession({ blocks: [makeBlock()] }),
      isReorderPending: true,
    });

    expect(screen.getByTestId("block-list-mock")).toHaveAttribute("data-parent-pending", "true");
  });

  it("passes data-parent-pending='false' to BlockList when isReorderPending is false", () => {
    renderSessionCard({ session: makeSession({ blocks: [makeBlock()] }) });

    expect(screen.getByTestId("block-list-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});
