import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

const { GroupIntoBoxCheckbox } = await import("./group-into-box-checkbox");

const CHECKBOX_LABEL = /group into one box/i;

describe("GroupIntoBoxCheckbox", () => {
  it("renders a checkbox labelled 'Group into one box' reflecting checked=true", () => {
    render(<GroupIntoBoxCheckbox checked onChange={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox", { name: CHECKBOX_LABEL });

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("reflects checked=false on the checkbox input", () => {
    render(<GroupIntoBoxCheckbox checked={false} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: CHECKBOX_LABEL })).not.toBeChecked();
  });

  it("fires onChange(false) when a checked box is clicked", () => {
    const onChange = vi.fn();

    render(<GroupIntoBoxCheckbox checked onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: CHECKBOX_LABEL }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("fires onChange(true) when an unchecked box is clicked", () => {
    const onChange = vi.fn();

    render(<GroupIntoBoxCheckbox checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: CHECKBOX_LABEL }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
