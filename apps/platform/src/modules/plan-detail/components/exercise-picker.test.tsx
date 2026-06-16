import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };
const createExerciseMock: Mock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
    useCreateExercise: () => ({ mutate: createExerciseMock, isPending: false }),
  };
});

const { ExercisePicker } = await import("./exercise-picker");

const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeExercise = (overrides: Partial<Exercise>): Exercise => ({
  id: "ckxw5p7gp0000q1mnzv5cuq01",
  canonicalName: "Front Squat",
  canonicalNameLower: "front squat",
  nature: "CONCRETE",
  defaultDemoUrls: [],
  aliases: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const FRONT_SQUAT = makeExercise({ id: "ckxw5p7gp0000q1mnzv5cuq01", canonicalName: "Front Squat" });
const DEADLIFT = makeExercise({
  id: "ckxw5p7gp0000q1mnzv5cuq02",
  canonicalName: "Deadlift",
  canonicalNameLower: "deadlift",
});

const onChange: Mock = vi.fn();

const openListbox = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

const typeQuery = (text: string): void => {
  fireEvent.change(screen.getByRole("combobox"), { target: { value: text } });
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
  createExerciseMock.mockReset();
});

describe("ExercisePicker search box", () => {
  it("renders the search placeholder", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    expect(screen.getByPlaceholderText("search by name or create a movement…")).toBeInTheDocument();
  });
});

describe("ExercisePicker selection", () => {
  it("emits the picked exercise id when an option is selected", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();
    fireEvent.click(screen.getByText("Deadlift"));

    expect(onChange).toHaveBeenCalledWith("ckxw5p7gp0000q1mnzv5cuq02");
  });

  it("offers the whole catalog as options without pre-filtering", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();

    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByText("Front Squat")).toBeInTheDocument();
    expect(screen.getByText("Deadlift")).toBeInTheDocument();
  });

  it("filters options to placeholders when placeholderOnly is set", () => {
    exercisesState.data = [
      FRONT_SQUAT,
      makeExercise({
        id: "ckxw5p7gp0000q1mnzv5cuq03",
        canonicalName: "Coach choice",
        nature: "PLACEHOLDER",
      }),
    ];

    render(<ExercisePicker value={null} onChange={onChange} placeholderOnly />);

    openListbox();

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Coach choice")).toBeInTheDocument();
  });
});

describe("ExercisePicker create affordance", () => {
  it("surfaces a Create option for a typed name with no exact match", () => {
    exercisesState.data = [FRONT_SQUAT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();
    typeQuery("Sled Push");

    expect(screen.getByText('Create "Sled Push"')).toBeInTheDocument();
  });

  it("opens the create modal when the Create option is chosen", () => {
    exercisesState.data = [FRONT_SQUAT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();
    typeQuery("Sled Push");
    fireEvent.click(screen.getByText('Create "Sled Push"'));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Create exercise" })).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Sled Push")).toBeInTheDocument();
  });
});

describe("ExercisePicker loading state", () => {
  it("disables the input while the catalog is loading", () => {
    exercisesState.isLoading = true;

    render(<ExercisePicker value={null} onChange={onChange} />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

describe("ExercisePicker required-exercise error (D-09)", () => {
  it("renders the field in error with the Pick an exercise helper", () => {
    exercisesState.data = [FRONT_SQUAT];

    render(<ExercisePicker value={null} onChange={onChange} error />);

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });
});

describe("ExercisePicker compact mode (D-10)", () => {
  it("renders the autocomplete combobox", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker compact value={null} onChange={onChange} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("emits the picked exercise id when an option is selected", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker compact value={null} onChange={onChange} />);

    openListbox();
    fireEvent.click(screen.getByText("Deadlift"));

    expect(onChange).toHaveBeenCalledWith("ckxw5p7gp0000q1mnzv5cuq02");
  });

  it("filters options to placeholders when placeholderOnly is set", () => {
    exercisesState.data = [
      FRONT_SQUAT,
      makeExercise({
        id: "ckxw5p7gp0000q1mnzv5cuq03",
        canonicalName: "Coach choice",
        nature: "PLACEHOLDER",
      }),
    ];

    render(<ExercisePicker compact value={null} onChange={onChange} placeholderOnly />);

    openListbox();

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Coach choice")).toBeInTheDocument();
  });

  it("disables the combobox when disabled is set", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker compact value={null} onChange={onChange} disabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
