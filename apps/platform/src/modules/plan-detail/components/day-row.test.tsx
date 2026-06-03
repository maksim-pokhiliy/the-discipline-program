import { createElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";

import {
  LabelOptionsContext,
  type LabelOptionsContextValue,
} from "@app/lib/contexts/label-options-provider";
import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateLabelMutate = vi.fn();
const updateNotesMutate = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateDayLabel: () => ({ mutate: updateLabelMutate }),
    useUpdateDayNotes: () => ({ mutate: updateNotesMutate }),
  };
});

vi.mock("./session-list", () => {
  const renderSessionListMock = ({ sessions }: { sessions: SessionWithLabel[] }) =>
    createElement(
      "div",
      { "data-testid": "session-list-mock" },
      `SessionList: ${String(sessions.length)} sessions`,
    );

  return { SessionList: renderSessionListMock };
});

vi.mock("./add-session-button", () => {
  const renderAddSessionButtonMock = () =>
    createElement("div", { "data-testid": "add-session-button-mock" }, "AddSessionButton");

  return { AddSessionButton: renderAddSessionButtonMock };
});

const { DayRow } = await import("./day-row");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const NOW = new Date("2025-01-06T00:00:00Z");

const makeLabel = (overrides: Partial<Label> = {}): Label => ({
  id: "clp9z8x7w0000abcd1234lab1",
  name: "MAIN",
  nameLower: "main",
  applicableLevels: ["DAY"],
  notes: null,
  rest: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeSession = (overrides: Partial<SessionWithLabel> = {}): SessionWithLabel => ({
  id: "clp9z8x7w0000abcd1234ses1",
  dayId: "clp9z8x7w0000abcd1234day1",
  order: 10,
  labelId: null,
  notes: null,
  freezeLoadsAtCreation: false,
  createdAt: NOW,
  updatedAt: NOW,
  label: null,
  blocks: [],
  ...overrides,
});

type RenderOptions = {
  date?: Date;
  label?: Label | null;
  notes?: string | null;
  sessions?: SessionWithLabel[];
  options?: Label[];
};

const renderDayRow = ({
  date = new Date(2026, 5, 3),
  label = null,
  notes = null,
  sessions = [],
  options = [],
}: RenderOptions = {}) => {
  const ctxValue: LabelOptionsContextValue = {
    DAY: { options, isLoading: false },
    SESSION: { options: [], isLoading: false },
    BLOCK: { options: [], isLoading: false },
  };

  return render(
    <LabelOptionsContext.Provider value={ctxValue}>
      <DayRow
        date={date}
        planId={PLAN_ID}
        startDate={START_DATE}
        dayOfWeek="MONDAY"
        label={label}
        notes={notes}
        sessions={sessions}
      />
    </LabelOptionsContext.Provider>,
  );
};

const getNotesInput = (): HTMLInputElement | HTMLTextAreaElement => {
  const el = screen.getByRole("textbox", { name: "Day notes" });

  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) {
    throw new Error("expected an input/textarea element for Day notes");
  }

  return el;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DayRow", () => {
  it("renders DayHead with the DOW overline, day-num h2, and month-short overline for a regular day", () => {
    const date = new Date(2026, 5, 3);

    renderDayRow({ date });

    const dow = screen.getByText("Wed");

    expect(dow).toHaveClass("MuiTypography-overline");
    expect(screen.getByText("Jun")).toHaveClass("MuiTypography-overline");

    const dayNum = screen.getByText("3");

    expect(dayNum).toHaveClass("MuiTypography-h2");
  });

  it("renders the today highlight with day-num h4 inside a primary disc", () => {
    const today = new Date();

    renderDayRow({ date: today });

    const dayNum = screen.getByText(String(today.getDate()));

    expect(dayNum).toHaveClass("MuiTypography-h4");
  });

  it("renders DayRowRest when label.rest is true and there are no sessions", () => {
    const label = makeLabel({ name: "REST DAY", rest: true });

    renderDayRow({ label, notes: "active recovery" });

    const restHeading = screen.getByRole("heading", { level: 3, name: "REST DAY" });
    const restPanel = restHeading.parentElement?.parentElement;

    expect(restHeading).toBeInTheDocument();
    expect(restPanel).not.toBeNull();

    if (restPanel === null || restPanel === undefined) {
      throw new Error("rest panel parent not found");
    }

    expect(within(restPanel).getByText("active recovery")).toBeInTheDocument();
    expect(screen.queryByTestId("session-list-mock")).toBeNull();
  });

  it("renders DayRowEmpty placeholder when there are no sessions and the label is not a rest label", () => {
    renderDayRow({ label: makeLabel(), sessions: [] });

    expect(screen.getByText("— no sessions yet —")).toBeInTheDocument();
    expect(screen.queryByTestId("session-list-mock")).toBeNull();
  });

  it("renders DayRowSummary with stats when sessions are present and the row is collapsed", () => {
    const session = makeSession({
      label: makeLabel({ name: "STRENGTH", applicableLevels: ["SESSION"] }),
    });

    renderDayRow({ sessions: [session] });

    expect(screen.getByText("STRENGTH")).toBeInTheDocument();
    expect(screen.getByText("0 blocks")).toBeInTheDocument();
    expect(screen.getByText("0 schemas")).toBeInTheDocument();
    expect(screen.queryByTestId("session-list-mock")).toBeNull();
  });

  it("renders the SessionList when the expand toggle is clicked", () => {
    const session = makeSession();

    renderDayRow({ sessions: [session] });

    const expandButton = screen.getByRole("button", { name: "Expand day" });

    fireEvent.click(expandButton);

    expect(screen.getByTestId("session-list-mock")).toHaveTextContent("SessionList: 1 sessions");
    expect(screen.getByRole("button", { name: "Collapse day" })).toBeInTheDocument();
  });

  it("collapses back to the summary when Collapse day is clicked after expanding", () => {
    const session = makeSession({
      label: makeLabel({ name: "STRENGTH", applicableLevels: ["SESSION"] }),
    });

    renderDayRow({ sessions: [session] });

    fireEvent.click(screen.getByRole("button", { name: "Expand day" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse day" }));

    expect(screen.queryByTestId("session-list-mock")).toBeNull();
    expect(screen.getByText("STRENGTH")).toBeInTheDocument();
  });

  it("toggles into the SessionList when DayRowSummary is clicked", () => {
    const session = makeSession();

    renderDayRow({ sessions: [session] });

    const summaryRow = screen.getByText("1 session");

    fireEvent.click(summaryRow);

    expect(screen.getByTestId("session-list-mock")).toBeInTheDocument();
  });

  it("fires useUpdateDayLabel.mutate with the selected option id when a label is picked", () => {
    updateLabelMutate.mockClear();
    const main = makeLabel({ name: "MAIN" });
    const recovery = makeLabel({ id: "clp9z8x7w0000abcd1234lab2", name: "RECOVERY" });

    renderDayRow({ label: main, options: [main, recovery] });

    fireEvent.click(screen.getByRole("button", { name: "Day label" }));

    const menu = screen.getByRole("menu");

    fireEvent.click(within(menu).getByText("RECOVERY"));

    expect(updateLabelMutate).toHaveBeenCalledTimes(1);
    expect(updateLabelMutate).toHaveBeenCalledWith({ labelId: recovery.id });
  });

  it("fires useUpdateDayNotes.mutate with the trimmed notes on blur", () => {
    updateNotesMutate.mockClear();

    renderDayRow();

    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  focus on bar path  " } });
    fireEvent.blur(input);

    expect(updateNotesMutate).toHaveBeenCalledTimes(1);
    expect(updateNotesMutate).toHaveBeenCalledWith({ notes: "focus on bar path" });
  });

  it("commits null instead of an empty string when the day note is cleared on blur", () => {
    updateNotesMutate.mockClear();

    renderDayRow({ notes: "previous note" });

    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(updateNotesMutate).toHaveBeenCalledTimes(1);
    expect(updateNotesMutate).toHaveBeenCalledWith({ notes: null });
  });
});
