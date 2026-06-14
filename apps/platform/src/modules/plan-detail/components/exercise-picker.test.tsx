import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { ExercisePicker } = await import("./exercise-picker");

const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeEquipment = (name: string): Exercise["equipment"][number] => ({
  id: "ckeq01234567890abcdef01234",
  name,
  nameLower: name.toLowerCase(),
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeExercise = (overrides: Partial<Exercise>): Exercise => ({
  id: "ckxw5p7gp0000q1mnzv5cuq01",
  canonicalName: "Front Squat",
  canonicalNameLower: "front squat",
  nature: "CONCRETE",
  movementFamily: "squat",
  defaultDemoUrls: [],
  aliases: [],
  equipment: [makeEquipment("Barbell")],
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
  movementFamily: "hinge",
});

const onChange: Mock = vi.fn();

const openListbox = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("ExercisePicker search box", () => {
  it("renders the search placeholder", () => {
    exercisesState.data = [FRONT_SQUAT, DEADLIFT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    expect(screen.getByPlaceholderText("search by name, family, or modality…")).toBeInTheDocument();
  });
});

describe("ExercisePicker option meta line", () => {
  it("shows the equipment names · family meta line under each option name", () => {
    exercisesState.data = [FRONT_SQUAT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();

    expect(screen.getByText("Front Squat")).toBeInTheDocument();
    expect(screen.getByText("Barbell · family: squat")).toBeInTheDocument();
  });

  it("joins multiple equipment names with a comma", () => {
    exercisesState.data = [
      makeExercise({
        movementFamily: null,
        equipment: [makeEquipment("Kettlebell"), makeEquipment("Dumbbell")],
      }),
    ];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();

    expect(screen.getByText("Kettlebell, Dumbbell")).toBeInTheDocument();
  });

  it("omits the family suffix when movementFamily is null", () => {
    exercisesState.data = [makeExercise({ movementFamily: null })];

    render(<ExercisePicker value={null} onChange={onChange} />);

    openListbox();

    expect(screen.getByText("Barbell")).toBeInTheDocument();
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
