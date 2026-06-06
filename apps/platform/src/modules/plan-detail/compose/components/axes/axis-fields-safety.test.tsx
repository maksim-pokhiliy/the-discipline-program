import { type ReactElement, useState } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import type {
  ComposeContainer,
  ComposeNode,
  NodeId,
  RepetitionAxis,
} from "../../compose-tree.types";
import { buildAxesSummary } from "../../lib/axes-summary";
import { asNodeId } from "../../lib/id-factory";
import { ComposeContainerInspector } from "../compose-container-inspector";

const baseContainer = (repetition?: RepetitionAxis): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("axis-container"),
  header: "Axis probe",
  notes: null,
  ...(repetition !== undefined && { repetition }),
  children: [],
});

const InspectorHarness = ({ initial }: { initial: ComposeContainer }): ReactElement => {
  const [container, setContainer] = useState<ComposeContainer>(initial);

  const handleUpdateNode = (id: NodeId, patch: (node: ComposeNode) => ComposeNode): void => {
    setContainer((current) => {
      if (current.id !== id) {
        return current;
      }

      const next = patch(current);

      return next.nodeType === "container" ? next : current;
    });
  };

  return (
    <>
      <div data-testid="repetition-json">{JSON.stringify(container.repetition ?? null)}</div>
      <div data-testid="rest-json">{JSON.stringify(container.rest ?? null)}</div>
      <div data-testid="summary">{buildAxesSummary(container).join(" | ")}</div>
      <ComposeContainerInspector
        container={container}
        exerciseById={new Map<string, Exercise>()}
        isScoringEditable
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

describe("cadence/interval axis fields store empty→0 input but stay inert (QA-10, SAFETY-PROBE: validation deferred to 10.2)", () => {
  it("stores cadence everyMin as 0 when cleared, keeping a structurally-valid cadence node", () => {
    render(
      <InspectorHarness initial={baseContainer({ kind: "cadence", everyMin: 1, rounds: 4 })} />,
    );

    fireEvent.change(spinbuttonByLabel("Every (min)"), { target: { value: "" } });

    const stored = readRepetition();

    expect(stored).toStrictEqual({ kind: "cadence", everyMin: 0, rounds: 4 });
  });

  it("stores a negative interval workMin verbatim, keeping a structurally-valid interval node", () => {
    render(
      <InspectorHarness
        initial={baseContainer({ kind: "interval", workMin: 2, offMin: 1, count: 3 })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Work (min)"), { target: { value: "-5" } });

    const stored = readRepetition();

    expect(stored).toStrictEqual({ kind: "interval", workMin: -5, offMin: 1, count: 3 });
  });

  it("renders the axes summary for the malformed cadence/interval values without throwing", () => {
    render(
      <InspectorHarness initial={baseContainer({ kind: "cadence", everyMin: 1, rounds: 4 })} />,
    );

    expect(() =>
      fireEvent.change(spinbuttonByLabel("Every (min)"), { target: { value: "" } }),
    ).not.toThrow();
    expect(screen.getByTestId("summary").textContent).toContain("EMOM");
  });
});

describe("window axis field stores malformed HH:MM but stays inert (QA-11, SAFETY-PROBE: validation deferred to 10.2)", () => {
  const selectWindow = (): void => {
    fireEvent.click(within(screen.getByRole("group", { name: "repetition" })).getByText("window"));
  };

  it("stores a malformed start time verbatim, keeping a structurally-valid window node", () => {
    render(<InspectorHarness initial={baseContainer()} />);

    selectWindow();
    fireEvent.change(screen.getByRole("textbox", { name: "Start HH:MM" }), {
      target: { value: "25:99" },
    });

    expect(readRepetition()).toStrictEqual({
      kind: "window",
      startHhMm: "25:99",
      endHhMm: "09:00",
    });
  });

  it("stores an empty end time verbatim without crashing the inspector or summary", () => {
    render(<InspectorHarness initial={baseContainer()} />);

    selectWindow();

    expect(() =>
      fireEvent.change(screen.getByRole("textbox", { name: "End HH:MM" }), {
        target: { value: "" },
      }),
    ).not.toThrow();
    expect(readRepetition()).toStrictEqual({ kind: "window", startHhMm: "06:00", endHhMm: "" });
  });
});

describe("rest axis field stores a refine-invalid RestSpec but stays inert (QA-12, SAFETY-PROBE: validation deferred to 10.2)", () => {
  it("stores a min-range rest whose rangeMax ≤ value verbatim, keeping a structurally-valid rest node", () => {
    render(<InspectorHarness initial={baseContainer()} />);

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
  });

  it("renders the rest summary for the refine-invalid value without throwing", () => {
    render(<InspectorHarness initial={baseContainer()} />);

    fireEvent.click(
      within(screen.getByRole("group", { name: "duration unit" })).getByText("min range"),
    );

    expect(() =>
      fireEvent.change(screen.getByRole("spinbutton", { name: "Rest max" }), {
        target: { value: "50" },
      }),
    ).not.toThrow();
    expect(screen.getByTestId("summary").textContent).toContain("rest");
  });
});

describe("switching repetition variant wholesale-replaces the body (QA-14, no stale fields)", () => {
  it("drops ladder steps when switching ladder → cadence", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "ladder", steps: [21, 15, 9] })} />);

    fireEvent.click(within(screen.getByRole("group", { name: "repetition" })).getByText("cadence"));

    const stored = readRepetition();

    expect(stored?.kind).toBe("cadence");
    expect(stored).not.toHaveProperty("steps");
  });
});
