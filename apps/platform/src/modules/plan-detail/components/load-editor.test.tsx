import { createElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { render } from "@app/test/render";

const NOW = new Date("2026-01-06T00:00:00.000Z");

const AXIS_ID_LEVEL = "clp9z8x7w0000abcd12axlevel";

const makeAxis = (
  overrides: Partial<ProfileAxis> & Pick<ProfileAxis, "id" | "label">,
): ProfileAxis => ({
  key: overrides.label.toLowerCase(),
  values: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const LEVEL_AXIS = makeAxis({ id: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"] });

const onChange = vi.fn();
const axesState: { data: ProfileAxis[] } = { data: [] };

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
  useCreateProfileAxis: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { LoadEditor } = await import("./load-editor");

beforeEach(() => {
  axesState.data = [];
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

  it("emits an unbound catalog-axis byProfile default when By profile is chosen", () => {
    render(<LoadEditor value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "By profile" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: "", label: "", values: [] }],
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

describe("LoadEditor byProfile kind-first authoring", () => {
  const boundCatalog = {
    kind: "byProfile" as const,
    axes: [
      { kind: "catalog" as const, axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"] },
    ],
    cells: [
      { coords: ["RX"], kg: 43 },
      { coords: ["SC"], kg: 30 },
    ],
  };

  it("offers the training-axis and athlete-attribute kind toggle", () => {
    render(<LoadEditor value={boundCatalog} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Training axis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Athlete attribute" })).toBeInTheDocument();
  });

  it("renders the bound catalog values read-only as chips with no value field", () => {
    render(<LoadEditor value={boundCatalog} onChange={onChange} />);

    expect(screen.queryByRole("textbox", { name: "Value" })).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "RX kg" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "SC kg" })).toBeInTheDocument();
  });

  it("binds the picked catalog axis and regenerates the cells", () => {
    axesState.data = [LEVEL_AXIS];

    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          axes: [{ kind: "catalog", axisId: "", label: "", values: [] }],
          cells: [],
        }}
        onChange={onChange}
      />,
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));
    fireEvent.click(screen.getByText("Level"));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: AXIS_ID_LEVEL, label: "Level", values: ["RX", "SC"] }],
      cells: [
        { coords: ["RX"], kg: Number.NaN },
        { coords: ["SC"], kg: Number.NaN },
      ],
    });
  });

  it("seeds the gender cells when the axis kind switches to athlete attribute", () => {
    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          axes: [{ kind: "catalog", axisId: "", label: "", values: [] }],
          cells: [],
        }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Athlete attribute" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      axes: [{ kind: "human", attribute: "gender" }],
      cells: [
        { coords: ["Male"], kg: Number.NaN },
        { coords: ["Female"], kg: Number.NaN },
      ],
    });
  });

  it("reveals the inline create form with the typed name when Create is chosen", () => {
    axesState.data = [];

    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          axes: [{ kind: "catalog", axisId: "", label: "", values: [] }],
          cells: [],
        }}
        onChange={onChange}
      />,
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Axis" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Axis" }), {
      target: { value: "Scale" },
    });
    fireEvent.click(screen.getByText('Create "Scale"'));

    const nameField = screen.getByRole("textbox", { name: "Axis name" });

    expect(nameField).toHaveValue("Scale");
    expect(screen.getByRole("button", { name: "Create axis" })).toBeInTheDocument();
  });

  it("seeds the human gender chips read-only on the attribute arm", () => {
    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          axes: [{ kind: "human", attribute: "gender" }],
          cells: [
            { coords: ["Male"], kg: 24 },
            { coords: ["Female"], kg: 16 },
          ],
        }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Male kg" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Female kg" })).toBeInTheDocument();
  });
});
