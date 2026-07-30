import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import { render } from "@app/test/render";

import { type SessionEditorControls } from "../utils/use-session-logging";

import { RowGroup } from "./row-group";

const FIRST_ROW_ID = "clz000000000000000000row1";
const SECOND_ROW_ID = "clz000000000000000000row2";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "cgender000000000000000000";

const FIRST_MOVEMENT = "Kettlebell Swing";
const SECOND_MOVEMENT = "1-arm KB overhead walking lunges";

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

const twoAxisLoad: Load = {
  kind: "byProfile",
  axes: [
    { axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null },
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", "Female"], binding: "GENDER" },
  ],
  cells: [
    { coords: ["RX", "Male"], kg: 60 },
    { coords: ["RX", "Female"], kg: 42 },
    { coords: ["Scaled", "Male"], kg: 45 },
    { coords: ["Scaled", "Female"], kg: 30 },
  ],
};

const buildMember = (
  rowId: string,
  movement: string,
  load: Load | null,
  resolvedLoad: ResolvedLoad | null,
): RowView => ({
  rowId,
  movement,
  media: null,
  sets: null,
  reps: { kind: "count", value: 18 },
  load,
  resolvedLoad,
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
});

const unpickedMember = (): RowView =>
  buildMember(FIRST_ROW_ID, FIRST_MOVEMENT, levelLoad, {
    status: "unresolved",
    reason: "missing_profile_pick",
    prompt: "pick_profile",
    axisLabels: ["Level"],
  });

const twoAxisMember = (): RowView =>
  buildMember(SECOND_ROW_ID, SECOND_MOVEMENT, twoAxisLoad, {
    status: "unresolved",
    reason: "missing_profile_attribute",
    prompt: "set_profile_attribute",
    attribute: "gender",
    axisLabels: ["Level", "Gender"],
  });

const resolvedMember = (): RowView =>
  buildMember(SECOND_ROW_ID, SECOND_MOVEMENT, twoAxisLoad, {
    status: "resolved",
    kg: 42,
    perHand: false,
    source: {
      kind: "profile",
      coords: [
        { axisId: LEVEL_AXIS_ID, label: "Level", value: "RX", binding: null },
        { axisId: GENDER_AXIS_ID, label: "Gender", value: "Female", binding: "GENDER" },
      ],
    },
  });

const UNPICKED_CHIP_LABEL = "RX: 24 / Scaled: 16 kg, Pick your level";
const TWO_AXIS_CHIP_LABEL = "30–60 kg, Pick your level";
const RESOLVED_CHIP_LABEL = "42 kg, RX · Female, change";

beforeEach(() => {
  openWeightSheet.mockReset();
});

describe("RowGroup", () => {
  it("renders a tappable chip for a grouped byProfile member (PU-03)", () => {
    render(<RowGroup label="Complex" members={[unpickedMember()]} editor={buildEditor()} />);

    expect(screen.getByRole("button", { name: UNPICKED_CHIP_LABEL })).toBeInTheDocument();
  });

  it("opens the weight sheet bound to the tapped member, not the first one", () => {
    const second = twoAxisMember();

    render(
      <RowGroup label="Complex" members={[unpickedMember(), second]} editor={buildEditor()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: TWO_AXIS_CHIP_LABEL }));

    expect(openWeightSheet).toHaveBeenCalledTimes(1);
    expect(openWeightSheet).toHaveBeenCalledWith(second, { kind: "level" });
  });

  it("keeps a resolved grouped weight reachable through its own chip", () => {
    const member = resolvedMember();

    render(<RowGroup label="Complex" members={[member]} editor={buildEditor()} />);

    fireEvent.click(screen.getByRole("button", { name: RESOLVED_CHIP_LABEL }));

    expect(openWeightSheet).toHaveBeenCalledWith(member, { kind: "level" });
  });

  it("keeps the member row right-aligned, gapped and wrapping (W1 regression, 3c397a7a)", () => {
    render(<RowGroup label="Complex" members={[unpickedMember()]} editor={buildEditor()} />);

    const memberRow = screen.getByRole("button", { name: UNPICKED_CHIP_LABEL }).parentElement
      ?.parentElement;

    expect(memberRow).toHaveStyle({ justifyContent: "flex-end", flexWrap: "wrap" });
    expect(memberRow).toHaveStyle({ gap: "12px" });
  });

  it("lets the movement stack absorb the free width (W1 regression, 3c397a7a)", () => {
    render(<RowGroup label="Complex" members={[unpickedMember()]} editor={buildEditor()} />);

    expect(screen.getByText(FIRST_MOVEMENT).parentElement).toHaveStyle({
      flex: "1 1 auto",
      minWidth: "0px",
    });
  });

  it("wraps the metric cluster as a whole instead of compressing it (W1 regression)", () => {
    render(<RowGroup label="Complex" members={[unpickedMember()]} editor={buildEditor()} />);

    const cluster = screen.getByRole("button", { name: UNPICKED_CHIP_LABEL }).parentElement;

    expect(cluster).toHaveStyle({ minWidth: "0px", overflowWrap: "anywhere", flexWrap: "wrap" });
    expect(cluster).not.toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("renders the volume and the @ separator beside the chip", () => {
    render(<RowGroup label="Complex" members={[unpickedMember()]} editor={buildEditor()} />);

    expect(screen.getByText("18 reps")).toBeInTheDocument();
    expect(screen.getByText("@")).toBeInTheDocument();
  });

  it("renders no @ separator and no chip for a member with no load", () => {
    render(
      <RowGroup
        label="Complex"
        members={[buildMember(FIRST_ROW_ID, FIRST_MOVEMENT, null, { status: "not_applicable" })]}
        editor={buildEditor()}
      />,
    );

    expect(screen.queryByText("@")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
