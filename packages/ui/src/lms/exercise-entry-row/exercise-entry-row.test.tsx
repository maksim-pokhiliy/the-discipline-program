import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";

import { render } from "../../test/render";

import { ExerciseEntryRow } from "./index";

const buildEntry = (overrides: Partial<ExerciseEntry> = {}): ExerciseEntry => ({
  id: "ckabcdef0000000000000abc1",
  setGroupId: "ckabcdef0000000000000abc2",
  order: 0,
  exerciseId: "ckabcdef0000000000000abc3",
  exerciseSnapshot: {
    id: "ckabcdef0000000000000abc3",
    name: "Back Squat",
    primaryMovement: "SQUAT",
    modality: "BARBELL",
    primaryBodyParts: ["QUADS"],
    defaultMetrics: undefined,
    demoVideoUrl: null,
    demoImageUrl: null,
  },
  prescription: {
    reps: { kind: "FIXED", value: 5 },
    sideMode: "BILATERAL",
    modifiers: [],
  },
  alternatives: [],
  externalUrl: null,
  notes: null,
  version: 1,
  ...overrides,
});

describe("ExerciseEntryRow", () => {
  it("renders read mode condensed display", () => {
    render(<ExerciseEntryRow entry={buildEntry()} mode="read" onChange={vi.fn()} />);

    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText(/5 reps/i)).toBeInTheDocument();
  });

  it("renders edit mode with reps + duration + notes", () => {
    render(<ExerciseEntryRow entry={buildEntry()} mode="edit" onChange={vi.fn()} />);

    expect(screen.getByLabelText(/^reps$/i)).toHaveValue(5);
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it("dispatches a duration patch on input change", () => {
    const onChange =
      vi.fn<(next: ExerciseEntry | ((prev: ExerciseEntry) => ExerciseEntry)) => void>();

    render(<ExerciseEntryRow entry={buildEntry()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: "45" } });

    const updater = onChange.mock.calls[0]?.[0];

    if (typeof updater !== "function") {
      throw new Error("Expected updater function");
    }

    expect(updater(buildEntry()).prescription.durationSec).toBe(45);
  });

  it("clears reps when input is emptied", () => {
    const onChange =
      vi.fn<(next: ExerciseEntry | ((prev: ExerciseEntry) => ExerciseEntry)) => void>();

    render(<ExerciseEntryRow entry={buildEntry()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/^reps$/i), { target: { value: "" } });

    const updater = onChange.mock.calls[0]?.[0];

    if (typeof updater !== "function") {
      throw new Error("Expected updater function");
    }

    expect(updater(buildEntry()).prescription.reps).toBeUndefined();
  });
});
