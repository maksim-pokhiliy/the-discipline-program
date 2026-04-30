import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { SchemeFormInner } from "./scheme-form-inner";

describe("SchemeFormInner dispatcher", () => {
  it("renders NONE form when archetype is NONE and params match", () => {
    render(
      <SchemeFormInner archetypeKind="NONE" innerParams={{ kind: "NONE" }} onChange={vi.fn()} />,
    );

    expect(screen.getByText(/no scheme parameters/i)).toBeInTheDocument();
  });

  it("renders COUNT_DOWN form when archetype is COUNT_DOWN", () => {
    render(
      <SchemeFormInner
        archetypeKind="COUNT_DOWN"
        innerParams={{ kind: "COUNT_DOWN", durationSec: 300 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it("renders COUNT_UP form when archetype is COUNT_UP", () => {
    render(
      <SchemeFormInner
        archetypeKind="COUNT_UP"
        innerParams={{ kind: "COUNT_UP" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/cap/i)).toBeInTheDocument();
  });

  it("renders INTERVAL_LOOP form when archetype is INTERVAL_LOOP", () => {
    render(
      <SchemeFormInner
        archetypeKind="INTERVAL_LOOP"
        innerParams={{
          kind: "INTERVAL_LOOP",
          sets: 5,
          slots: [{ durationSec: 30, action: "WORK" }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^sets/i)).toBeInTheDocument();
  });

  it("renders EMOM_LOOP form when archetype is EMOM_LOOP", () => {
    render(
      <SchemeFormInner
        archetypeKind="EMOM_LOOP"
        innerParams={{
          kind: "EMOM_LOOP",
          totalMinutes: 10,
          slots: [{ minutes: [0], action: { kind: "REST" } }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/total minutes/i)).toBeInTheDocument();
  });

  it("falls back to typed default when innerParams are unparseable", () => {
    render(
      <SchemeFormInner
        archetypeKind="COUNT_DOWN"
        innerParams={"garbage" as unknown}
        onChange={vi.fn()}
      />,
    );

    const duration = screen.getByLabelText(/duration/i) as HTMLInputElement;

    expect(duration.value).toBe("600");
  });

  it("falls back to typed default when innerParams.kind mismatches archetypeKind", () => {
    render(
      <SchemeFormInner
        archetypeKind="EMOM_LOOP"
        innerParams={{ kind: "COUNT_DOWN", durationSec: 300 }}
        onChange={vi.fn()}
      />,
    );

    const totalMinutes = screen.getByLabelText(/total minutes/i) as HTMLInputElement;

    expect(totalMinutes.value).toBe("10");
  });

  it("invokes onChange with typed value when COUNT_DOWN duration changes", () => {
    const onChange = vi.fn();

    render(
      <SchemeFormInner
        archetypeKind="COUNT_DOWN"
        innerParams={{ kind: "COUNT_DOWN", durationSec: 300 }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: "180" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ durationSec: 180 }));
  });
});
