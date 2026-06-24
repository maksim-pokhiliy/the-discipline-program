import { createElement } from "react";

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { render } from "@app/test/render";

const NOW = new Date("2026-01-06T00:00:00.000Z");

const AXIS_ID_LEVEL = "clp9z8x7w0000abcd12axlevel";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";

const makeAxis = (
  overrides: Partial<ProfileAxis> & Pick<ProfileAxis, "id" | "label">,
): ProfileAxis => ({
  key: overrides.label.toLowerCase(),
  values: [],
  binding: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const LEVEL_AXIS = makeAxis({ id: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"] });
const GENDER_AXIS = makeAxis({
  id: SYSTEM_GENDER_AXIS_ID,
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
});

const onChange = vi.fn();
const axesState: { data: ProfileAxis[] } = { data: [] };
const createAxisMutate = vi.fn();
const createAxisState = { isPending: false };

vi.mock("./exercise-picker", () => {
  const renderExercisePickerMock = (props: { value: string | null }) =>
    createElement("input", {
      "data-testid": "exercise-picker-mock",
      value: props.value ?? "",
      readOnly: true,
    });

  return { ExercisePicker: renderExercisePickerMock };
});

vi.mock("@app/lib/hooks/use-profile-axes", () => ({
  useProfileAxes: () => ({ data: axesState.data, isFetching: false }),
}));

vi.mock("@app/lib/hooks/use-create-profile-axis", () => ({
  useCreateProfileAxis: () => ({
    mutateAsync: createAxisMutate,
    isPending: createAxisState.isPending,
  }),
}));

const { LoadEditor } = await import("./load-editor");

beforeEach(() => {
  axesState.data = [];
  createAxisState.isPending = false;
  createAxisMutate.mockReset();
});

afterEach(() => {
  onChange.mockReset();
});

describe("LoadEditor kind switching", () => {
  it("emits an incomplete absolute default when Absolute is chosen", () => {
    render(<LoadEditor value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Absolute" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "absolute", count: 1, kg: Number.NaN });
  });

  it("emits a self-referenced percentage default when % 1RM is chosen", () => {
    render(<LoadEditor value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "% 1RM" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "percentage",
      value: Number.NaN,
      reference: { scope: "self" },
    });
  });

  it("emits a bodyweight load when Bodyweight is chosen", () => {
    render(<LoadEditor value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Bodyweight" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "bodyweight" });
  });

  it("emits an unbound axis-draft byProfile default when By profile is chosen", () => {
    render(<LoadEditor value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "By profile" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      axes: [{ axisId: "", label: "", values: [], binding: null }],
      cells: [],
    });
  });

  it("clears the load to null via no load", () => {
    render(<LoadEditor value={{ kind: "bodyweight" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "no load" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders no body for bodyweight", () => {
    render(<LoadEditor value={{ kind: "bodyweight" }} onChange={onChange} />);

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });
});

describe("LoadEditor absolute sub-fields", () => {
  it("emits the 2× count toggle (D6)", () => {
    render(<LoadEditor value={{ kind: "absolute", count: 1, kg: 60 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2×" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "absolute", count: 2, kg: 60 });
  });

  it("emits the edited weight", () => {
    render(<LoadEditor value={{ kind: "absolute", count: 1, kg: 60 }} onChange={onChange} />);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "72.5" } });

    expect(onChange).toHaveBeenCalledWith({ kind: "absolute", count: 1, kg: 72.5 });
  });
});

describe("LoadEditor percentage sub-fields", () => {
  it("adds an optional max% range above the value", () => {
    render(
      <LoadEditor
        value={{ kind: "percentage", value: 80, reference: { scope: "self" } }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "add range" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "percentage",
      value: 80,
      rangeMax: 85,
      reference: { scope: "self" },
    });
  });

  it("switches the reference to other_exercise and reveals the exercise picker", () => {
    render(
      <LoadEditor
        value={{ kind: "percentage", value: 80, reference: { scope: "self" } }}
        onChange={onChange}
      />,
    );

    expect(screen.queryByTestId("exercise-picker-mock")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Other exercise" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "percentage",
      value: 80,
      reference: { scope: "other_exercise", targetExerciseId: "" },
    });
  });

  it("renders the exercise picker when the reference is already other_exercise", () => {
    render(
      <LoadEditor
        value={{
          kind: "percentage",
          value: 80,
          reference: { scope: "other_exercise", targetExerciseId: "clp9z8x7w0000abcd1234ex001" },
        }}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId("exercise-picker-mock")).toBeInTheDocument();
  });
});

describe("LoadEditor byProfile single-picker authoring", () => {
  const boundCatalog = {
    kind: "byProfile" as const,
    axes: [{ axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"], binding: null }],
    cells: [
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
    ],
  };

  const unboundDraft = {
    kind: "byProfile" as const,
    axes: [{ axisId: "", label: "", values: [], binding: null }],
    cells: [],
  };

  it("renders a single axis picker with no kind toggle", () => {
    render(<LoadEditor value={boundCatalog} onChange={onChange} />);

    expect(screen.getByRole("combobox", { name: "Axis" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Training axis" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Athlete attribute" })).not.toBeInTheDocument();
  });

  it("renders the bound catalog values read-only as chips with no value field", () => {
    render(<LoadEditor value={boundCatalog} onChange={onChange} />);

    expect(screen.queryByRole("textbox", { name: "Value" })).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "RX kg" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "SC kg" })).toBeInTheDocument();
  });

  it("binds the picked catalog axis and regenerates the cells", () => {
    axesState.data = [LEVEL_AXIS];

    render(<LoadEditor value={unboundDraft} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));
    fireEvent.click(screen.getByText("Level"));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      axes: [{ axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"], binding: null }],
      cells: [
        { coords: ["RX"], kg: Number.NaN },
        { coords: ["SC"], kg: Number.NaN },
      ],
    });
  });

  it("picks the system Gender axis from the list, binding GENDER and seeding the gender cells", () => {
    axesState.data = [GENDER_AXIS];

    render(<LoadEditor value={unboundDraft} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));

    const option = screen.getByText("Gender");

    expect(
      within(option.closest("li") as HTMLElement).getByText("Profile attribute"),
    ).toBeInTheDocument();

    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      axes: [
        {
          axisId: SYSTEM_GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["Male"], kg: Number.NaN },
        { coords: ["Female"], kg: Number.NaN },
      ],
    });
  });

  it("does not badge a plain catalog axis as a profile attribute", () => {
    axesState.data = [LEVEL_AXIS];

    render(<LoadEditor value={unboundDraft} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));

    const option = screen.getByText("Level");

    expect(
      within(option.closest("li") as HTMLElement).queryByText("Profile attribute"),
    ).not.toBeInTheDocument();
  });

  it("reveals the inline create form with the typed name when Create is chosen", () => {
    axesState.data = [];

    render(<LoadEditor value={unboundDraft} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Axis" }), {
      target: { value: "Scale" },
    });
    fireEvent.click(screen.getByText('Create "Scale"'));

    const nameField = screen.getByRole("textbox", { name: "Axis name" });

    expect(nameField).toHaveValue("Scale");
    expect(screen.getByRole("button", { name: "Create axis" })).toBeInTheDocument();
  });
});

describe("LoadEditor byProfile inline create round-trip", () => {
  const NEW_AXIS_ID = "clp9z8x7w0000abcd12axscale";

  const renderUnbound = (): void => {
    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          axes: [{ axisId: "", label: "", values: [], binding: null }],
          cells: [],
        }}
        onChange={onChange}
      />,
    );
  };

  const revealCreateForm = (typedName: string): void => {
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Axis" }), {
      target: { value: typedName },
    });
    fireEvent.click(screen.getByText(`Create "${typedName}"`));
  };

  const addValue = (value: string): void => {
    const valuesField = screen.getByRole("textbox", { name: "Values" });

    fireEvent.change(valuesField, { target: { value } });
    fireEvent.keyDown(valuesField, { key: "Enter" });
  };

  it("binds the created axis and regenerates the cells on a resolved create (Must-Test 9)", async () => {
    createAxisMutate.mockResolvedValue(
      makeAxis({ id: NEW_AXIS_ID, label: "Scale", values: ["Light", "Heavy"] }),
    );
    renderUnbound();
    revealCreateForm("Scale");
    addValue("Light");
    addValue("Heavy");

    fireEvent.click(screen.getByRole("button", { name: "Create axis" }));

    expect(createAxisMutate).toHaveBeenCalledWith({
      key: "Scale",
      label: "Scale",
      values: ["Light", "Heavy"],
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        kind: "byProfile",
        axes: [{ axisId: NEW_AXIS_ID, label: "Scale", values: ["Light", "Heavy"], binding: null }],
        cells: [
          { coords: ["Light"], kg: Number.NaN },
          { coords: ["Heavy"], kg: Number.NaN },
        ],
      }),
    );
  });

  it("keeps Create axis disabled until both a name and at least one value exist (Must-Test 10)", () => {
    renderUnbound();
    revealCreateForm("Scale");

    expect(screen.getByRole("button", { name: "Create axis" })).toBeDisabled();

    addValue("Light");

    expect(screen.getByRole("button", { name: "Create axis" })).toBeEnabled();
  });

  it("keeps Create axis disabled while the create mutation is pending (Must-Test 10)", () => {
    createAxisState.isPending = true;
    renderUnbound();
    revealCreateForm("Scale");
    addValue("Light");

    expect(screen.getByRole("button", { name: "Create axis" })).toBeDisabled();
  });

  it("keeps the form open, surfaces an inline error, and does not bind on a rejected create (Must-Test 11)", async () => {
    createAxisMutate.mockRejectedValue(new Error("conflict"));
    renderUnbound();
    revealCreateForm("Scale");
    addValue("Light");

    fireEvent.click(screen.getByRole("button", { name: "Create axis" }));

    await waitFor(() =>
      expect(screen.getByText(/an axis with this name may already exist/i)).toBeInTheDocument(),
    );

    expect(screen.getByRole("textbox", { name: "Axis name" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders an orphan bound catalog axis from its snapshot without crashing (Must-Test 13)", () => {
    axesState.data = [];

    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          axes: [
            { axisId: NEW_AXIS_ID, label: "Retired Axis", values: ["RX", "SC"], binding: null },
          ],
          cells: [
            { coords: ["RX"], kg: 40 },
            { coords: ["SC"], kg: 28 },
          ],
        }}
        onChange={onChange}
      />,
    );

    const chipLabels = Array.from(document.querySelectorAll(".MuiChip-label")).map(
      (node) => node.textContent,
    );

    expect(screen.getByRole("combobox", { name: "Axis" })).toHaveValue("Retired Axis");
    expect(chipLabels).toEqual(["RX", "SC"]);
    expect(screen.getByRole("spinbutton", { name: "RX kg" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "SC kg" })).toBeInTheDocument();
  });
});
