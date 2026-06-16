import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };
const createExerciseState = { isPending: false };
const createExerciseMock: Mock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
    useCreateExercise: () => ({
      mutate: createExerciseMock,
      isPending: createExerciseState.isPending,
    }),
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
  createExerciseState.isPending = false;
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

describe("ExercisePicker create modal lifecycle", () => {
  const openCreateModal = (name: string): HTMLElement => {
    openListbox();
    typeQuery(name);
    fireEvent.click(screen.getByText(`Create "${name}"`));

    return screen.getByRole("dialog");
  };

  const submitModal = (dialog: HTMLElement): void => {
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
  };

  it("keeps the modal open and selects nothing when the create mutation fails (QA-002 error path)", async () => {
    exercisesState.data = [FRONT_SQUAT];
    createExerciseMock.mockImplementation(() => undefined);

    render(<ExercisePicker value={null} onChange={onChange} />);

    submitModal(openCreateModal("Sled Push"));

    await vi.waitFor(() => expect(createExerciseMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects the minted exercise and closes the modal on a successful create", async () => {
    const minted = makeExercise({
      id: "ckxw5p7gp0000q1mnzv5cuq07",
      canonicalName: "Sled Push",
      canonicalNameLower: "sled push",
    });

    exercisesState.data = [FRONT_SQUAT];
    createExerciseMock.mockImplementation(
      (_data, options: { onSuccess: (exercise: Exercise) => void }) => {
        options.onSuccess(minted);
      },
    );

    render(<ExercisePicker value={null} onChange={onChange} />);

    submitModal(openCreateModal("Sled Push"));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith("ckxw5p7gp0000q1mnzv5cuq07"));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancels without selecting anything when the modal close button is clicked (no phantom select)", async () => {
    exercisesState.data = [FRONT_SQUAT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    const dialog = openCreateModal("Sled Push");

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    expect(createExerciseMock).not.toHaveBeenCalled();
  });

  it("does not close on the X button while the create is submitting (QA-009)", () => {
    exercisesState.data = [FRONT_SQUAT];
    createExerciseState.isPending = true;

    render(<ExercisePicker value={null} onChange={onChange} />);

    const dialog = openCreateModal("Sled Push");

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("resets stale field edits when the modal is reopened for the same typed name (QA-005)", async () => {
    exercisesState.data = [FRONT_SQUAT];

    render(<ExercisePicker value={null} onChange={onChange} />);

    const firstOpen = openCreateModal("Sled Push");
    const aliasInput = within(firstOpen).getByLabelText("Aliases");

    fireEvent.change(aliasInput, { target: { value: "Prowler Push" } });
    fireEvent.keyDown(aliasInput, { key: "Enter" });

    expect(within(firstOpen).getByText("Prowler Push")).toBeInTheDocument();

    fireEvent.click(within(firstOpen).getByRole("button", { name: "Close" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    const secondOpen = openCreateModal("Sled Push");

    expect(within(secondOpen).queryByText("Prowler Push")).not.toBeInTheDocument();
    expect(within(secondOpen).getByDisplayValue("Sled Push")).toBeInTheDocument();
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
