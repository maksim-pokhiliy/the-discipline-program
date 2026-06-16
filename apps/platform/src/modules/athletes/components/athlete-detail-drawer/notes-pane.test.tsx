import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachNote } from "@repo/contracts/coaching/coach-note";

import { render } from "@app/test/render";

const ATHLETE_ID = "clz00000000000000000ath1";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const notesState = {
  data: [] as CoachNote[],
  isLoading: false,
};
const createMutate = vi.fn();
const createState = { isPending: false };

vi.mock("@app/lib/hooks", () => ({
  useCoachNotes: () => ({ data: notesState.data, isLoading: notesState.isLoading }),
  useCreateCoachNote: () => ({ mutate: createMutate, isPending: createState.isPending }),
}));

const { NotesPane } = await import("./notes-pane");

const makeNote = (id: string, content: string): CoachNote => ({
  id,
  coachId: "clz00000000000000000coa1",
  athleteId: ATHLETE_ID,
  content,
  createdAt: NOW,
  updatedAt: NOW,
});

beforeEach(() => {
  notesState.data = [];
  notesState.isLoading = false;
  createState.isPending = false;
  createMutate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NotesPane list", () => {
  it("renders the existing notes from the hook", () => {
    notesState.data = [
      makeNote("clz00000000000000000not1", "Strong session, watch the left knee"),
      makeNote("clz00000000000000000not2", "Skipped Monday, follow up"),
    ];

    render(<NotesPane athleteId={ATHLETE_ID} />);

    expect(screen.getByText("Strong session, watch the left knee")).toBeInTheDocument();
    expect(screen.getByText("Skipped Monday, follow up")).toBeInTheDocument();
  });

  it("shows the empty-notes copy when there are none", () => {
    render(<NotesPane athleteId={ATHLETE_ID} />);

    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });
});

describe("NotesPane add", () => {
  it("disables Add note until the draft has content", () => {
    render(<NotesPane athleteId={ATHLETE_ID} />);

    expect(screen.getByRole("button", { name: /Add note/ })).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "New note" } });

    expect(screen.getByRole("button", { name: /Add note/ })).not.toBeDisabled();
  });

  it("creates a trimmed note for the athlete on Add", () => {
    render(<NotesPane athleteId={ATHLETE_ID} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  follow up call  " } });
    fireEvent.click(screen.getByRole("button", { name: /Add note/ }));

    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.calls[0]?.[0]).toEqual({
      athleteId: ATHLETE_ID,
      content: "follow up call",
    });
  });

  it("does not submit a whitespace-only draft", () => {
    render(<NotesPane athleteId={ATHLETE_ID} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "    " } });
    fireEvent.click(screen.getByRole("button", { name: /Add note/ }));

    expect(createMutate).not.toHaveBeenCalled();
  });
});
