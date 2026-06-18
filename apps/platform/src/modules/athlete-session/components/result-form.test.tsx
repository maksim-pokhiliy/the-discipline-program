import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { ResultForm } from "./result-form";

const noop = (): void => {};

describe("ResultForm", () => {
  it("renders two fields for a time benchmark", () => {
    render(<ResultForm title="Fran" resultType="time" draft={{}} onChange={noop} />);

    expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seconds/i)).toBeInTheDocument();
  });

  it("renders rounds and reps fields for a rounds_reps benchmark", () => {
    render(<ResultForm title="Cindy" resultType="rounds_reps" draft={{}} onChange={noop} />);

    expect(screen.getByLabelText(/rounds/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^reps$/i)).toBeInTheDocument();
  });

  it("renders a single kg field for a load benchmark", () => {
    render(<ResultForm title="Heavy" resultType="load" draft={{}} onChange={noop} />);

    expect(screen.getByLabelText(/load \(kg\)/i)).toBeInTheDocument();
  });

  it("renders a single reps field for a max_reps benchmark", () => {
    render(<ResultForm title="Max Pull-Ups" resultType="max_reps" draft={{}} onChange={noop} />);

    expect(screen.getByLabelText(/reps/i)).toBeInTheDocument();
  });

  it("renders a distance field and a unit toggle for a distance benchmark", () => {
    render(<ResultForm title="Row" resultType="distance" draft={{}} onChange={noop} />);

    expect(screen.getByLabelText(/distance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "km" })).toBeInTheDocument();
  });

  it("renders a calories field for a calories benchmark", () => {
    render(<ResultForm title="Echo" resultType="calories" draft={{}} onChange={noop} />);

    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
  });

  it("renders the schema title and the result-type label", () => {
    render(<ResultForm title="Cindy" resultType="rounds_reps" draft={{}} onChange={noop} />);

    expect(screen.getByText("Cindy")).toBeInTheDocument();
    expect(screen.getByText(/Result · Rounds \+ Reps/i)).toBeInTheDocument();
  });
});
