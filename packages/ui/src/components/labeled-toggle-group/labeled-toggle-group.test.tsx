import { ToggleButton } from "@mui/material";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { LabeledToggleGroup } from "./labeled-toggle-group";

describe("LabeledToggleGroup", () => {
  it("exposes the group with the label as its accessible name", () => {
    render(
      <LabeledToggleGroup label="scope" value="self" onChange={vi.fn()}>
        <ToggleButton value="self">self</ToggleButton>
        <ToggleButton value="family">family</ToggleButton>
      </LabeledToggleGroup>,
    );

    expect(screen.getByRole("group", { name: "scope" })).toBeInTheDocument();
  });

  it("renders the visible caption text", () => {
    render(
      <LabeledToggleGroup label="qualifier" value="fixed" onChange={vi.fn()}>
        <ToggleButton value="fixed">fixed</ToggleButton>
      </LabeledToggleGroup>,
    );

    expect(screen.getByText("qualifier")).toBeInTheDocument();
  });

  it("forwards the selected value as a pressed button", () => {
    render(
      <LabeledToggleGroup label="unit" value="min" onChange={vi.fn()}>
        <ToggleButton value="sec">sec</ToggleButton>
        <ToggleButton value="min">min</ToggleButton>
      </LabeledToggleGroup>,
    );

    expect(screen.getByRole("button", { name: "min", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "sec", pressed: false })).toBeInTheDocument();
  });

  it("invokes onChange with the next value when a button is clicked", () => {
    const onChange = vi.fn();

    render(
      <LabeledToggleGroup label="unit" value="min" onChange={onChange}>
        <ToggleButton value="sec">sec</ToggleButton>
        <ToggleButton value="min">min</ToggleButton>
      </LabeledToggleGroup>,
    );

    fireEvent.click(screen.getByRole("button", { name: "sec" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.anything(), "sec");
  });

  it("disables every toggle button when disabled is set", () => {
    render(
      <LabeledToggleGroup label="unit" value="min" onChange={vi.fn()} disabled={true}>
        <ToggleButton value="sec">sec</ToggleButton>
        <ToggleButton value="min">min</ToggleButton>
      </LabeledToggleGroup>,
    );

    expect(screen.getByRole("button", { name: "sec" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "min" })).toBeDisabled();
  });

  it("renders the helper node alongside the group when provided", () => {
    render(
      <LabeledToggleGroup
        label="equipment"
        value="DUMBBELL"
        onChange={vi.fn()}
        helper={<span data-testid="group-helper">required</span>}
      >
        <ToggleButton value="DUMBBELL">Dumbbell</ToggleButton>
      </LabeledToggleGroup>,
    );

    expect(screen.getByTestId("group-helper")).toBeInTheDocument();
  });
});
