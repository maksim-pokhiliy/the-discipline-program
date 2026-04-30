import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultSchemeParams } from "@repo/contracts/lms/_domain";

import { render } from "../../test/render";

import { SchemeForm } from "./index";

describe("SchemeForm router", () => {
  it("renders NONE form when archetype is NONE", () => {
    render(
      <SchemeForm
        archetypeKind="NONE"
        schemeParams={defaultSchemeParams("NONE")}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/no scheme parameters/i)).toBeInTheDocument();
  });

  it("renders COUNT_DOWN form with duration field", () => {
    const params = defaultSchemeParams("COUNT_DOWN");

    render(<SchemeForm archetypeKind="COUNT_DOWN" schemeParams={params} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it("renders EMOM_LOOP form with totalMinutes field", () => {
    const params = defaultSchemeParams("EMOM_LOOP");

    render(<SchemeForm archetypeKind="EMOM_LOOP" schemeParams={params} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/total minutes/i)).toBeInTheDocument();
  });

  it("renders nothing when params kind doesn't match archetype", () => {
    const { container } = render(
      <SchemeForm
        archetypeKind="EMOM_LOOP"
        schemeParams={defaultSchemeParams("COUNT_DOWN")}
        onChange={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("invokes onChange when COUNT_DOWN duration changes", () => {
    const onChange = vi.fn();

    render(
      <SchemeForm
        archetypeKind="COUNT_DOWN"
        schemeParams={defaultSchemeParams("COUNT_DOWN")}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: "120" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ durationSec: 120 }));
  });

  it("invokes onChange when INTERVAL_LOOP sets changes", () => {
    const onChange = vi.fn();
    const params = defaultSchemeParams("INTERVAL_LOOP");

    render(<SchemeForm archetypeKind="INTERVAL_LOOP" schemeParams={params} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/^sets/i), { target: { value: "5" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sets: 5 }));
  });
});
