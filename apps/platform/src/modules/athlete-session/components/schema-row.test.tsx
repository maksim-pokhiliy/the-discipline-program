import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import { render } from "@app/test/render";

import { type SessionEditorControls } from "../utils/use-session-logging";

import { SchemaRow } from "./schema-row";

const ROW_ID = "clz000000000000000000row1";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const MOVEMENT = "Back Squat";

const openWeightSheet = vi.fn();

const EMPTY_ROW_IDS: ReadonlySet<string> = new Set<string>();

const buildEditor = (
  pulsingRowIds: ReadonlySet<string> = EMPTY_ROW_IDS,
): SessionEditorControls => ({
  activeLogSchemaId: null,
  isLoggingBenchmark: false,
  pulsingRowIds,
  draftFor: vi.fn(() => ({})),
  openLog: vi.fn(),
  cancelLog: vi.fn(),
  saveLog: vi.fn(),
  setDraftField: vi.fn(),
  openWeightSheet,
});

const levelLoad: Load = {
  kind: "byProfile",
  axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null }],
  cells: [
    { coords: ["RX"], kg: 24 },
    { coords: ["Scaled"], kg: 16 },
  ],
};

const buildRow = (load: Load | null, resolvedLoad: ResolvedLoad | null): RowView => ({
  rowId: ROW_ID,
  movement: MOVEMENT,
  media: null,
  sets: 3,
  reps: { kind: "count", value: 10 },
  load,
  resolvedLoad,
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
});

const unpickedRow = (): RowView =>
  buildRow(levelLoad, {
    status: "unresolved",
    reason: "missing_profile_pick",
    prompt: "pick_profile",
    axisLabels: ["Level"],
  });

const resolvedProfileRow = (): RowView =>
  buildRow(levelLoad, {
    status: "resolved",
    kg: 24,
    perHand: false,
    source: {
      kind: "profile",
      coords: [{ axisId: LEVEL_AXIS_ID, label: "Level", value: "RX", binding: null }],
    },
  });

const UNPICKED_CHIP_LABEL = "RX: 24 / Scaled: 16 kg, Pick your level";
const RESOLVED_CHIP_LABEL = "24 kg, RX, change";

beforeEach(() => {
  openWeightSheet.mockReset();
});

describe("SchemaRow", () => {
  it("keeps the outer row right-aligned and wrapping (W1 regression, 3c397a7a)", () => {
    render(<SchemaRow row={unpickedRow()} editor={buildEditor()} />);

    const outerRow = screen.getByText(MOVEMENT).parentElement?.parentElement;

    expect(outerRow).toHaveStyle({ justifyContent: "flex-end", flexWrap: "wrap" });
    expect(outerRow).toHaveStyle({ minWidth: "0px" });
  });

  it("keeps the right cluster shrinkable and right-aligned (W1 regression, 3c397a7a)", () => {
    render(<SchemaRow row={unpickedRow()} editor={buildEditor()} />);

    const cluster = screen.getByRole("button", { name: UNPICKED_CHIP_LABEL }).parentElement;

    expect(cluster).toHaveStyle({ flex: "0 1 auto", minWidth: "0px" });
    expect(cluster).toHaveStyle({ flexWrap: "wrap", justifyContent: "flex-end" });
  });

  it("never pins the load cluster to a single line (W1 regression, 3c397a7a)", () => {
    render(<SchemaRow row={unpickedRow()} editor={buildEditor()} />);

    const cluster = screen.getByRole("button", { name: UNPICKED_CHIP_LABEL }).parentElement;

    expect(cluster).not.toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("keeps the movement text ellipsised on one line", () => {
    render(<SchemaRow row={unpickedRow()} editor={buildEditor()} />);

    expect(screen.getByText(MOVEMENT)).toHaveStyle({
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
  });

  it("opens the weight sheet bound to this row when a prompt chip is tapped", () => {
    const row = unpickedRow();

    render(<SchemaRow row={row} editor={buildEditor()} />);

    fireEvent.click(screen.getByRole("button", { name: UNPICKED_CHIP_LABEL }));

    expect(openWeightSheet).toHaveBeenCalledTimes(1);
    expect(openWeightSheet).toHaveBeenCalledWith(row, { kind: "level" });
  });

  it("opens the weight sheet from a resolved chip too, so the source stays reachable", () => {
    const row = resolvedProfileRow();

    render(<SchemaRow row={row} editor={buildEditor()} />);

    fireEvent.click(screen.getByRole("button", { name: RESOLVED_CHIP_LABEL }));

    expect(openWeightSheet).toHaveBeenCalledWith(row, { kind: "level" });
  });

  it("renders the @ separator whenever the row carries a load value", () => {
    render(<SchemaRow row={resolvedProfileRow()} editor={buildEditor()} />);

    expect(screen.getByText("@")).toBeInTheDocument();
  });

  it("renders no @ separator and no chip for a row with no load", () => {
    render(<SchemaRow row={buildRow(null, { status: "not_applicable" })} editor={buildEditor()} />);

    expect(screen.queryByText("@")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("leaves a bare load non-interactive", () => {
    render(
      <SchemaRow
        row={buildRow(
          { kind: "absolute", count: 1, kg: 40 },
          { status: "resolved", kg: 40, perHand: false },
        )}
        editor={buildEditor()}
      />,
    );

    expect(screen.getByText("40 kg")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
