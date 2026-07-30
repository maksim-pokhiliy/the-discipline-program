import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type ResolvedLoad,
  type ResolvedLoadSource,
  type RowView,
} from "@repo/contracts/lms/session-detail";

import { type LevelAxis } from "@app/lib/level-switch";
import { render } from "@app/test/render";

import { type WeightSheetControls, type WeightSheetState } from "../utils/use-weight-sheet";

import { WeightSourceSheet } from "./weight-source-sheet";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const EXERCISE_ID = "clz000000000000000000ex01";
const RECORDED_AT = "2026-07-12T10:00:00.000Z";

const LEVEL_AXIS: LevelAxis = {
  id: LEVEL_AXIS_ID,
  label: "Level",
  values: ["RX", "Scaled"],
  binding: null,
};

const LEVEL_LOAD: Load = {
  kind: "byProfile",
  axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null }],
  cells: [
    { coords: ["RX"], kg: 24 },
    { coords: ["Scaled"], kg: 16 },
  ],
};

const ONE_RM_SOURCE: ResolvedLoadSource = {
  kind: "one_rm",
  exerciseId: EXERCISE_ID,
  percent: 80,
  baseKg: 120,
  recordedAt: RECORDED_AT,
  recordSource: OneRMRecordSource.MANUAL,
};

const RESOLVED_ONE_RM: ResolvedLoad = {
  status: "resolved",
  kg: 96,
  perHand: false,
  source: ONE_RM_SOURCE,
};

const row = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: "clz0000000000000000000row1",
  movement: "Back Squat",
  media: null,
  sets: null,
  reps: null,
  load: LEVEL_LOAD,
  resolvedLoad: { status: "resolved", kg: 24, perHand: false },
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
  ...overrides,
});

const LEVEL_SHEET: WeightSheetState = { kind: "level", row: row() };

const MAX_SHEET: WeightSheetState = {
  kind: "one_rm",
  exerciseId: EXERCISE_ID,
  row: row({
    load: { kind: "percentage", value: 80, reference: { scope: "self" } },
    resolvedLoad: RESOLVED_ONE_RM,
  }),
};

const closeSheet = vi.fn();
const pickLevelCoordinate = vi.fn();
const applyLevel = vi.fn();
const setMaxValue = vi.fn();
const saveMax = vi.fn();

const controls = (sheet: WeightSheetState | null): WeightSheetControls => ({
  sheet,
  levelAxes: sheet?.kind === "level" ? [LEVEL_AXIS] : [],
  levelCoordinates: {},
  levelSavedCoordinates: {},
  levelWeightCount: 2,
  isLevelDraftComplete: false,
  isApplyingLevel: false,
  isOtherApplyPending: false,
  levelOutcome: null,
  maxValue: "",
  isSavingMax: false,
  canSaveMax: false,
  closeSheet,
  pickLevelCoordinate,
  applyLevel,
  setMaxValue,
  saveMax,
});

const stubViewport = (isDesktop: boolean): void => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const drawerRoot = (): Element | null => document.querySelector(".MuiDrawer-root");
const dialogRoot = (): Element | null => document.querySelector(".MuiDialog-root");

beforeEach(() => {
  closeSheet.mockReset();
  pickLevelCoordinate.mockReset();
  applyLevel.mockReset();
  setMaxValue.mockReset();
  saveMax.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WeightSourceSheet responsive container (D-F)", () => {
  it("renders a bottom drawer and no dialog below md", () => {
    stubViewport(false);
    render(<WeightSourceSheet {...controls(LEVEL_SHEET)} />);

    expect(drawerRoot()).not.toBeNull();
    expect(dialogRoot()).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the house dialog and no drawer at md and above", () => {
    stubViewport(true);
    render(<WeightSourceSheet {...controls(LEVEL_SHEET)} />);

    expect(dialogRoot()).not.toBeNull();
    expect(drawerRoot()).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("mounts nothing while no chip has been tapped", () => {
    stubViewport(false);
    render(<WeightSourceSheet {...controls(null)} />);

    expect(drawerRoot()).toBeNull();
    expect(dialogRoot()).toBeNull();
  });

  it("labels the mobile sheet by its own title node", () => {
    stubViewport(false);
    render(<WeightSourceSheet {...controls(LEVEL_SHEET)} />);

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Your level");
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("labels the desktop dialog by the same title", () => {
    stubViewport(true);
    render(<WeightSourceSheet {...controls(LEVEL_SHEET)} />);

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Your level");
  });
});

describe("WeightSourceSheet body routing", () => {
  it("opens the level body on a level target", () => {
    stubViewport(false);
    render(<WeightSourceSheet {...controls(LEVEL_SHEET)} />);

    expect(screen.getByText("Your level")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Level" })).toBeInTheDocument();
    expect(
      screen.getByText("Applies to 2 weights in this session — and this whole plan."),
    ).toBeInTheDocument();
  });

  it("titles the max body with the movement", () => {
    stubViewport(false);
    render(<WeightSourceSheet {...controls(MAX_SHEET)} />);

    expect(screen.getByText("Your Back Squat max")).toBeInTheDocument();
    expect(screen.getByText("This plan asks for 80% of it.")).toBeInTheDocument();
    expect(screen.getByText("Latest record · 120 kg · 12 Jul 2026")).toBeInTheDocument();
  });

  it("titles the max body with the movement on desktop too", () => {
    stubViewport(true);
    render(<WeightSourceSheet {...controls(MAX_SHEET)} />);

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Your Back Squat max");
  });

  it("issues no request when the max sheet opens", () => {
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);
    stubViewport(false);
    render(<WeightSourceSheet {...controls(MAX_SHEET)} />);

    expect(screen.getByText("Latest record · 120 kg · 12 Jul 2026")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("closes from the body's Cancel", () => {
    stubViewport(false);
    render(<WeightSourceSheet {...controls(LEVEL_SHEET)} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(closeSheet).toHaveBeenCalledTimes(1);
  });
});
