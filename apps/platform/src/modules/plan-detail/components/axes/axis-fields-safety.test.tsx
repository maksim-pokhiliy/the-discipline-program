import { type ReactElement, useState } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import { asNodeId } from "../../lib/axis-draft-id";

import type {
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  NodeId,
  RepetitionAxis,
} from "./axis-draft.types";
import { ContainerInspector } from "./container-inspector";

const baseContainer = (repetition?: RepetitionAxis): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("axis-container"),
  header: "Axis probe",
  notes: null,
  ...(repetition !== undefined && { repetition }),
  children: [],
});

const uncommittedMarkerRow = (): ComposeRow => ({
  nodeType: "row",
  id: asNodeId("ladder-marker-row"),
  rowKind: "INNER_LADDER_MARKER",
  rowPayload: { rowKind: "REST_SLOT" },
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: null,
});

const containerWithChild = (repetition: RepetitionAxis, child: ComposeNode): ComposeContainer => ({
  ...baseContainer(repetition),
  children: [child],
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
      <ContainerInspector
        container={container}
        exerciseById={new Map<string, Exercise>()}
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
const REST_RANGE_MESSAGE = "rangeMax is required and must be greater than value for range units";

describe("cadence/interval axis fields surface contract errors while storing the typed value (T2-5)", () => {
  it("shows the positivity error on cadence everyMin when cleared, still storing everyMin 0", () => {
    render(
      <InspectorHarness initial={baseContainer({ kind: "cadence", everyMin: 1, rounds: 4 })} />,
    );

    fireEvent.change(spinbuttonByLabel("Every (min)"), { target: { value: "" } });

    expect(readRepetition()).toStrictEqual({ kind: "cadence", everyMin: 0, rounds: 4 });
    expect(spinbuttonByLabel("Every (min)")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(POSITIVE_MESSAGE)).toBeInTheDocument();
  });

  it("shows the positivity error on a negative interval workMin, still storing -5", () => {
    render(
      <InspectorHarness
        initial={baseContainer({ kind: "interval", workMin: 2, offMin: 1, count: 3 })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Work (min)"), { target: { value: "-5" } });

    expect(readRepetition()).toStrictEqual({ kind: "interval", workMin: -5, offMin: 1, count: 3 });
    expect(spinbuttonByLabel("Work (min)")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(POSITIVE_MESSAGE)).toBeInTheDocument();
  });

  it("accepts interval offMin 0 with no error and a min attribute of 0", () => {
    render(
      <InspectorHarness
        initial={baseContainer({ kind: "interval", workMin: 2, offMin: 1, count: 3 })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Off (min)"), { target: { value: "0" } });

    expect(readRepetition()).toStrictEqual({ kind: "interval", workMin: 2, offMin: 0, count: 3 });
    expect(spinbuttonByLabel("Off (min)")).toHaveAttribute("aria-invalid", "false");
    expect(spinbuttonByLabel("Off (min)")).toHaveAttribute("min", "0");
  });

  it("shows the nonnegative error on a negative interval offMin, still storing -1 (QA-T25-7)", () => {
    render(
      <InspectorHarness
        initial={baseContainer({ kind: "interval", workMin: 2, offMin: 1, count: 3 })}
      />,
    );

    fireEvent.change(spinbuttonByLabel("Off (min)"), { target: { value: "-1" } });

    expect(readRepetition()).toStrictEqual({ kind: "interval", workMin: 2, offMin: -1, count: 3 });
    expect(spinbuttonByLabel("Off (min)")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(NONNEGATIVE_MESSAGE)).toBeInTheDocument();
  });
});

describe("rest axis field surfaces the refine error while storing the typed value (T2-5)", () => {
  it("shows the rangeMax error when rangeMax ≤ value, still storing the typed rest", () => {
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
    expect(screen.getByRole("spinbutton", { name: "Rest max" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText(REST_RANGE_MESSAGE)).toBeInTheDocument();
  });
});

describe("ladder × inner-marker mutex surfaces an inline repetition error (T2-4)", () => {
  it("shows the conflict error when a ladder container holds an uncommitted marker row", () => {
    render(
      <InspectorHarness
        initial={containerWithChild({ kind: "ladder", steps: [21, 15, 9] }, uncommittedMarkerRow())}
      />,
    );

    expect(screen.getByText(/inner-ladder-marker row/i)).toBeInTheDocument();
  });

  it("shows no conflict error when the same marker sits under a non-ladder repetition", () => {
    render(
      <InspectorHarness
        initial={containerWithChild({ kind: "count", count: 3 }, uncommittedMarkerRow())}
      />,
    );

    expect(screen.queryByText(/inner-ladder-marker row/i)).not.toBeInTheDocument();
  });
});

describe("switching repetition variant wholesale-replaces the body (QA-14, no stale fields)", () => {
  it("drops ladder steps when switching ladder → cadence", () => {
    render(<InspectorHarness initial={baseContainer({ kind: "ladder", steps: [21, 15, 9] })} />);

    fireEvent.click(screen.getByRole("button", { name: "EMOM" }));

    const stored = readRepetition();

    expect(stored?.kind).toBe("cadence");
    expect(stored).not.toHaveProperty("steps");
  });
});
