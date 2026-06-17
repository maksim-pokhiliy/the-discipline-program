import { type ReactElement, useState } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { asNodeId } from "../../lib/axis-draft-id";

import type { NodeId, RepetitionAxis, SchemaDraft } from "./axis-draft.types";
import { ContainerInspector } from "./container-inspector";

const baseContainer = (repetition?: RepetitionAxis): SchemaDraft => ({
  id: asNodeId("axis-container"),
  header: "Axis probe",
  notes: null,
  ...(repetition !== undefined && { repetition }),
  rows: [],
});

const InspectorHarness = ({ initial }: { initial: SchemaDraft }): ReactElement => {
  const [container, setContainer] = useState<SchemaDraft>(initial);

  const handleUpdateNode = (id: NodeId, patch: (schema: SchemaDraft) => SchemaDraft): void => {
    setContainer((current) => (current.id === id ? patch(current) : current));
  };

  return (
    <>
      <div data-testid="repetition-json">{JSON.stringify(container.repetition ?? null)}</div>
      <div data-testid="rest-json">{JSON.stringify(container.rest ?? null)}</div>
      <ContainerInspector
        container={container}
        isCreateMode
        onUpdateNode={handleUpdateNode}
        onRename={() => undefined}
      />
    </>
  );
};

const readRepetition = (): RepetitionAxis | null =>
  JSON.parse(screen.getByTestId("repetition-json").textContent ?? "null") as RepetitionAxis | null;

const readRest = (): Record<string, unknown> | null =>
  JSON.parse(screen.getByTestId("rest-json").textContent ?? "null") as Record<
    string,
    unknown
  > | null;

const spinbuttonByLabel = (name: string): HTMLElement => screen.getByRole("spinbutton", { name });

const POSITIVE_MESSAGE = "Number must be greater than 0";
const NONNEGATIVE_MESSAGE = "Number must be greater than or equal to 0";
const NAN_MESSAGE = "Expected number, received nan";
const REST_RANGE_MESSAGE = "rangeMax is required and must be greater than value for range units";
const SWITCH_CONFIRM = "Switch & discard";
const SWITCH_CANCEL = "Keep editing";

describe("cadence/interval axis fields surface contract errors while storing the typed value (T2-5)", () => {
  it("clears cadence everyMin to an empty field and surfaces the number error (no auto-0)", () => {
    render(
      <InspectorHarness initial={baseContainer({ kind: "cadence", everyMin: 1, rounds: 4 })} />,
    );

    fireEvent.change(spinbuttonByLabel("Every (min)"), { target: { value: "" } });

    expect(readRepetition()).toStrictEqual({ kind: "cadence", everyMin: null, rounds: 4 });
    expect(spinbuttonByLabel("Every (min)")).toHaveValue(null);
    expect(spinbuttonByLabel("Every (min)")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(NAN_MESSAGE)).toBeInTheDocument();
  });

  it("shows the positivity error on a negative interval work value, still storing -5", () => {
    render(
      <InspectorHarness
        initial={baseContainer({
          kind: "interval",
          work: { value: 2, unit: "min" },
          off: { value: 1, unit: "min" },
          count: 3,
        })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Work"), { target: { value: "-5" } });

    expect(readRepetition()).toStrictEqual({
      kind: "interval",
      work: { value: -5, unit: "min" },
      off: { value: 1, unit: "min" },
      count: 3,
    });
    expect(spinbuttonByLabel("Work")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(POSITIVE_MESSAGE)).toBeInTheDocument();
  });

  it("accepts interval off value 0 with no error and a min attribute of 0", () => {
    render(
      <InspectorHarness
        initial={baseContainer({
          kind: "interval",
          work: { value: 2, unit: "min" },
          off: { value: 1, unit: "min" },
          count: 3,
        })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Off"), { target: { value: "0" } });

    expect(readRepetition()).toStrictEqual({
      kind: "interval",
      work: { value: 2, unit: "min" },
      off: { value: 0, unit: "min" },
      count: 3,
    });
    expect(spinbuttonByLabel("Off")).toHaveAttribute("aria-invalid", "false");
    expect(spinbuttonByLabel("Off")).toHaveAttribute("min", "0");
  });

  it("shows the nonnegative error on a negative interval off value, still storing -1 (QA-T25-7)", () => {
    render(
      <InspectorHarness
        initial={baseContainer({
          kind: "interval",
          work: { value: 2, unit: "min" },
          off: { value: 1, unit: "min" },
          count: 3,
        })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Off"), { target: { value: "-1" } });

    expect(readRepetition()).toStrictEqual({
      kind: "interval",
      work: { value: 2, unit: "min" },
      off: { value: -1, unit: "min" },
      count: 3,
    });
    expect(spinbuttonByLabel("Off")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(NONNEGATIVE_MESSAGE)).toBeInTheDocument();
  });

  it("toggles the interval work unit from min to sec, storing the typed value (sub-minute)", () => {
    render(
      <InspectorHarness
        initial={baseContainer({
          kind: "interval",
          work: { value: 20, unit: "min" },
          off: { value: 10, unit: "sec" },
          count: 8,
        })}
      />,
    );

    fireEvent.click(
      within(screen.getByRole("group", { name: "interval work unit" })).getByText("sec"),
    );

    expect(readRepetition()).toStrictEqual({
      kind: "interval",
      work: { value: 20, unit: "sec" },
      off: { value: 10, unit: "sec" },
      count: 8,
    });
    expect(spinbuttonByLabel("Work")).toHaveAttribute("aria-invalid", "false");
  });
});

describe("rest axis field surfaces the refine error while storing the typed value (T2-5)", () => {
  it("shows the rangeMax error when rangeMax ≤ value, still storing the typed rest", () => {
    render(<InspectorHarness initial={baseContainer()} />);

    fireEvent.click(screen.getByRole("button", { name: "Add rest" }));

    fireEvent.click(
      within(screen.getByRole("group", { name: "duration unit" })).getByText("min range"),
    );
    fireEvent.change(screen.getByRole("spinbutton", { name: "Rest value" }), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Rest max" }), {
      target: { value: "50" },
    });

    const stored = readRest();

    expect(stored).not.toBeNull();
    expect(stored?.duration).toStrictEqual({ value: 100, unit: "range_min", rangeMax: 50 });
    expect(screen.getByRole("spinbutton", { name: "Rest max" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText(REST_RANGE_MESSAGE)).toBeInTheDocument();
  });
});

describe("switching repetition variant wholesale-replaces the body (QA-14, no stale fields)", () => {
  it("drops ladder steps immediately when a pristine ladder switches to cadence", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "ladder", steps: [21, 15, 9] })} />);

    fireEvent.click(screen.getByRole("button", { name: "EMOM" }));

    const stored = readRepetition();

    expect(stored?.kind).toBe("cadence");
    expect(stored).not.toHaveProperty("steps");
    expect(screen.queryByRole("button", { name: SWITCH_CONFIRM })).toBeNull();
  });
});

describe("a dirty repetition kind-switch is gated by a confirm (QA-004)", () => {
  it("defers the switch and keeps the edited ladder until the coach confirms", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "ladder", steps: [20, 15, 9] })} />);

    fireEvent.click(screen.getByRole("button", { name: "EMOM" }));

    expect(readRepetition()).toStrictEqual({ kind: "ladder", steps: [20, 15, 9] });
    expect(screen.getByRole("button", { name: SWITCH_CONFIRM })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: SWITCH_CONFIRM }));

    const stored = readRepetition();

    expect(stored?.kind).toBe("cadence");
    expect(stored).not.toHaveProperty("steps");
  });

  it("keeps the edited ladder and the active kind when the switch is cancelled", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "ladder", steps: [20, 15, 9] })} />);

    fireEvent.click(screen.getByRole("button", { name: "EMOM" }));
    fireEvent.click(screen.getByRole("button", { name: SWITCH_CANCEL }));

    expect(readRepetition()).toStrictEqual({ kind: "ladder", steps: [20, 15, 9] });
  });

  it("switches a pristine non-ladder kind silently with no confirm", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "count", count: 3 })} />);

    fireEvent.click(screen.getByRole("button", { name: "EMOM" }));

    expect(readRepetition()).toStrictEqual({ kind: "cadence", everyMin: 1, rounds: 4 });
    expect(screen.queryByRole("button", { name: SWITCH_CONFIRM })).toBeNull();
  });
});

describe("the inspector exposes no arrangement or interleave control after the axis death (DR-W2-2)", () => {
  it("renders neither an arrangement nor an interleave group for any container", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "once" })} />);

    expect(screen.queryByRole("group", { name: "arrangement" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "interleave" })).not.toBeInTheDocument();
  });
});
