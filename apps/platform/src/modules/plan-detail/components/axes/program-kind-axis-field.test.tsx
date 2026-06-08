import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StagedProgramKind } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { ProgramKindAxisField } from "./program-kind-axis-field";

const GROUP_LABEL = "program";

const renderField = (
  value: StagedProgramKind | undefined,
  onChange: (next?: StagedProgramKind) => void,
) => render(<ProgramKindAxisField value={value} onChange={onChange} />);

const pressedButton = (name: string): HTMLElement =>
  screen.getByRole("button", { name, pressed: true });

const button = (name: string): HTMLElement => screen.getByRole("button", { name });

describe("ProgramKindAxisField", () => {
  it("renders the program toggle group", () => {
    renderField(undefined, vi.fn());

    expect(screen.getByRole("group", { name: GROUP_LABEL })).toBeInTheDocument();
  });

  it("presses the none button when no program kind is set", () => {
    renderField(undefined, vi.fn());

    expect(pressedButton("none")).toBeInTheDocument();
  });

  it("presses the matching kind button when a program kind is set", () => {
    renderField("cluster", vi.fn());

    expect(pressedButton("cluster")).toBeInTheDocument();
  });

  it("emits the selected kind when a kind button is clicked", () => {
    const onChange = vi.fn();

    renderField(undefined, onChange);
    fireEvent.click(button("wave"));

    expect(onChange).toHaveBeenCalledWith("wave");
  });

  it("emits undefined when the none button is clicked", () => {
    const onChange = vi.fn();

    renderField("wave", onChange);
    fireEvent.click(button("none"));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
