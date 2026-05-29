import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { NamedThemedSetsForm, namedThemedSetsDefaultParams } from "./named-themed-sets-schema-form";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("NamedThemedSetsForm rendering", () => {
  it("renders a count field and a theme text field for the default params", () => {
    render(<NamedThemedSetsForm value={namedThemedSetsDefaultParams} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: "Count" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("seeds count 4 and an empty theme as the default params", () => {
    expect(namedThemedSetsDefaultParams).toEqual({ count: 4, theme: "" });
  });
});

describe("NamedThemedSetsForm theme editing", () => {
  it("emits onChange with the updated theme while preserving the count", () => {
    render(<NamedThemedSetsForm value={{ count: 4, theme: "" }} onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Benchmarks" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ count: 4, theme: "Benchmarks" });
  });
});

describe("NamedThemedSetsForm error surfacing", () => {
  it("shows the theme error helperText when an error prop is passed", () => {
    render(
      <NamedThemedSetsForm
        value={{ count: 4, theme: "" }}
        onChange={onChange}
        error={{
          theme: { type: "too_small", message: "String must contain at least 1 character(s)" },
        }}
      />,
    );

    expect(screen.getByText("String must contain at least 1 character(s)")).toBeInTheDocument();
  });
});
