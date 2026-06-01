import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { TempoDigit } from "./tempo-digit";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const getInput = (): HTMLInputElement => screen.getByRole("textbox");

describe("TempoDigit rendering", () => {
  it("renders its label and the current value", () => {
    render(<TempoDigit value={3} onChange={onChange} label="ecc" />);

    expect(screen.getByText("ecc")).toBeInTheDocument();
    expect(getInput()).toHaveValue("3");
  });
});

describe("TempoDigit clamps to 0..60", () => {
  it("clamps a value above 60 down to 60", () => {
    render(<TempoDigit value={3} onChange={onChange} label="ecc" />);

    fireEvent.change(getInput(), { target: { value: "99" } });

    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("clamps a negative value up to 0", () => {
    render(<TempoDigit value={3} onChange={onChange} label="ecc" />);

    fireEvent.change(getInput(), { target: { value: "-5" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("emits 0 for non-numeric garbage", () => {
    render(<TempoDigit value={3} onChange={onChange} label="ecc" />);

    fireEvent.change(getInput(), { target: { value: "abc" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("emits the typed integer when in range", () => {
    render(<TempoDigit value={3} onChange={onChange} label="ecc" />);

    fireEvent.change(getInput(), { target: { value: "4" } });

    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe("TempoDigit explosive X notation", () => {
  it("displays X for a zero value when allowX is set", () => {
    render(<TempoDigit value={0} onChange={onChange} label="con" allowX />);

    expect(getInput()).toHaveValue("X");
  });

  it("emits 0 when X is typed and allowX is set", () => {
    render(<TempoDigit value={3} onChange={onChange} label="con" allowX />);

    fireEvent.change(getInput(), { target: { value: "X" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("emits 0 when a lowercase x is typed and allowX is set", () => {
    render(<TempoDigit value={3} onChange={onChange} label="con" allowX />);

    fireEvent.change(getInput(), { target: { value: "x" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("displays 0 numerically when allowX is not set", () => {
    render(<TempoDigit value={0} onChange={onChange} label="pause⬆" />);

    expect(getInput()).toHaveValue("0");
  });
});
