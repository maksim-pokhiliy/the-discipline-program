import { createElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

const onChange = vi.fn();

vi.mock("./exercise-picker", () => {
  const renderExercisePickerMock = (props: { value: string | null }) =>
    createElement("input", {
      "data-testid": "exercise-picker-mock",
      value: props.value ?? "",
      readOnly: true,
    });

  return { ExercisePicker: renderExercisePickerMock };
});

const { LoadEditor } = await import("./load-editor");

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

  it("emits a single-entry byProfile default when By profile is chosen", () => {
    render(<LoadEditor value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "By profile" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      entries: [{ label: "", kg: Number.NaN }],
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

describe("LoadEditor byProfile sub-fields", () => {
  it("appends an empty entry on add profile", () => {
    render(
      <LoadEditor
        value={{ kind: "byProfile", entries: [{ label: "m", kg: 50 }] }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "add profile" }));

    expect(onChange).toHaveBeenCalledWith({
      kind: "byProfile",
      entries: [
        { label: "m", kg: 50 },
        { label: "", kg: Number.NaN },
      ],
    });
  });

  it("removes an entry but keeps at least one", () => {
    render(
      <LoadEditor
        value={{
          kind: "byProfile",
          entries: [
            { label: "m", kg: 50 },
            { label: "f", kg: 35 },
          ],
        }}
        onChange={onChange}
      />,
    );

    const removeButtons = screen.getAllByRole("button", { name: "Remove profile" });

    fireEvent.click(removeButtons[1] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith({ kind: "byProfile", entries: [{ label: "m", kg: 50 }] });
  });

  it("disables removal when only one entry remains", () => {
    render(
      <LoadEditor
        value={{ kind: "byProfile", entries: [{ label: "m", kg: 50 }] }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Remove profile" })).toBeDisabled();
  });
});
