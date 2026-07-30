import { type ReactElement } from "react";

import { fireEvent, type RenderResult, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import {
  type LevelApplyOutcome,
  type LevelAxis,
  PICK_APPLYING_LABEL,
  PICK_CURRENT_LABEL,
  PICK_RETRY_LABEL,
} from "@app/lib/level-switch";
import { render } from "@app/test/render";

import {
  LEVEL_CTA_BUSY,
  LEVEL_CTA_LOADING,
  LEVEL_SHEET_SUBTITLE,
} from "../utils/weight-sheet.constants";

import { LevelSheetBody } from "./level-sheet-body";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "clz00000000000000000axs03";
const LONG_VALUE = "Advanced masters competitor";
const LONG_VALUE_SHORTENED = "Advanced maste…";

const LEVEL_AXIS: LevelAxis = {
  id: LEVEL_AXIS_ID,
  label: "Level",
  values: ["RX", "Scaled"],
  binding: null,
};

const GENDER_AXIS: LevelAxis = {
  id: GENDER_AXIS_ID,
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
};

const TWO_AXIS_LOAD: Load = {
  kind: "byProfile",
  axes: [
    { axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null },
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", "Female"], binding: "GENDER" },
  ],
  cells: [
    { coords: ["RX", "Male"], kg: 24 },
    { coords: ["RX", "Female"], kg: 18 },
    { coords: ["Scaled", "Male"], kg: 16 },
    { coords: ["Scaled", "Female"], kg: 12 },
  ],
};

const RESOLVED_16: ResolvedLoad = { status: "resolved", kg: 16, perHand: false };

const row = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: "clz0000000000000000000row1",
  movement: "DB Snatch",
  media: null,
  sets: null,
  reps: null,
  load: TWO_AXIS_LOAD,
  resolvedLoad: RESOLVED_16,
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
  ...overrides,
});

const onPick = vi.fn();
const onApply = vi.fn();
const onCancel = vi.fn();

type BodyState = {
  row?: RowView;
  axes?: LevelAxis[];
  coordinates?: Record<string, string>;
  savedCoordinates?: Record<string, string>;
  weightCount?: number;
  isComplete?: boolean;
  isApplying?: boolean;
  isBlocked?: boolean;
  outcome?: LevelApplyOutcome | null;
};

const bodyOf = (state: BodyState = {}): ReactElement => (
  <LevelSheetBody
    row={state.row ?? row()}
    axes={state.axes ?? [LEVEL_AXIS, GENDER_AXIS]}
    coordinates={state.coordinates ?? {}}
    savedCoordinates={state.savedCoordinates ?? {}}
    weightCount={state.weightCount ?? 2}
    isComplete={state.isComplete ?? false}
    isApplying={state.isApplying ?? false}
    isBlocked={state.isBlocked ?? false}
    outcome={state.outcome ?? null}
    onPick={onPick}
    onApply={onApply}
    onCancel={onCancel}
  />
);

const renderBody = (state: BodyState = {}): RenderResult => render(bodyOf(state));

const pickedBoth: Record<string, string> = {
  [LEVEL_AXIS_ID]: "RX",
  [GENDER_AXIS_ID]: "Female",
};

const draftedScaled: Record<string, string> = { ...pickedBoth, [LEVEL_AXIS_ID]: "Scaled" };

const currentName = (value: string): string => `${value} ${PICK_CURRENT_LABEL}`;

beforeEach(() => {
  onPick.mockReset();
  onApply.mockReset();
  onCancel.mockReset();
});

describe("LevelSheetBody microcopy", () => {
  it("renders the ratified subtitle", () => {
    renderBody();

    expect(screen.getByText("Sets the weights this plan resolves for you.")).toBeInTheDocument();
    expect(screen.getByText(LEVEL_SHEET_SUBTITLE)).toBeInTheDocument();
  });

  it("renders the plural scope line naming every profile-resolved weight in the session", () => {
    renderBody({ weightCount: 2 });

    expect(
      screen.getByText("Applies to 2 weights in this session — and this whole plan."),
    ).toBeInTheDocument();
  });

  it("renders the singular scope line for a session with one profile-resolved weight", () => {
    renderBody({ weightCount: 1 });

    expect(
      screen.getByText("Applies to 1 weight in this session — and this whole plan."),
    ).toBeInTheDocument();
  });

  it("names the drafted coordinates on the apply CTA", () => {
    renderBody({ coordinates: pickedBoth, isComplete: true });

    expect(screen.getByRole("button", { name: "Apply RX · Female" })).toBeEnabled();
  });

  it("lists the missing axes lowercased on a disabled pick CTA", () => {
    renderBody();

    expect(screen.getByRole("button", { name: "Pick level & gender" })).toBeDisabled();
  });

  it("owns up to still loading rather than promising an apply the button cannot do", () => {
    renderBody({ coordinates: pickedBoth, isComplete: false });

    const cta = screen.getByRole("button", { name: LEVEL_CTA_LOADING });

    expect(cta).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Apply RX · Female" })).not.toBeInTheDocument();
  });

  it("names the apply still settling rather than dying silently on a second sheet", () => {
    renderBody({ coordinates: pickedBoth, isComplete: true, isBlocked: true });

    const cta = screen.getByRole("button", { name: LEVEL_CTA_BUSY });

    expect(cta).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Scaled" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("truncates a long coordinate on the apply CTA", () => {
    renderBody({
      axes: [{ ...LEVEL_AXIS, values: [LONG_VALUE, "Scaled"] }],
      coordinates: { [LEVEL_AXIS_ID]: LONG_VALUE },
      isComplete: true,
      row: row({ load: null, resolvedLoad: null }),
    });

    expect(
      screen.getByRole("button", { name: `Apply ${LONG_VALUE_SHORTENED}` }),
    ).toBeInTheDocument();
  });

  it("offers Cancel", () => {
    renderBody();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("LevelSheetBody preview strip", () => {
  it("previews the move for this row when the draft is complete", () => {
    renderBody({
      coordinates: { [LEVEL_AXIS_ID]: "Scaled", [GENDER_AXIS_ID]: "Female" },
      isComplete: true,
    });

    expect(screen.getByText("This row · DB Snatch: 16 kg → 12 kg")).toBeInTheDocument();
  });

  it("drops the arrow when the drafted weight does not move", () => {
    renderBody({
      coordinates: { [LEVEL_AXIS_ID]: "Scaled", [GENDER_AXIS_ID]: "Male" },
      isComplete: true,
    });

    expect(screen.getByText("This row · DB Snatch: 16 kg")).toBeInTheDocument();
  });

  it("states only the drafted weight when the row has no current value", () => {
    renderBody({
      row: row({ resolvedLoad: null }),
      coordinates: pickedBoth,
      isComplete: true,
    });

    expect(screen.getByText("This row · DB Snatch: 18 kg")).toBeInTheDocument();
  });

  it("renders no preview while the draft is incomplete", () => {
    renderBody({ coordinates: { [LEVEL_AXIS_ID]: "RX" } });

    expect(screen.queryByText(/This row/)).not.toBeInTheDocument();
  });
});

describe("LevelSheetBody radiogroups (D-12)", () => {
  it("renders one radiogroup per axis of the row, gender included", () => {
    renderBody();

    expect(screen.getByRole("radiogroup", { name: "Level" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Gender" })).toBeInTheDocument();
    expect(screen.getAllByRole("radiogroup")).toHaveLength(2);
  });

  it("exposes exactly one element with role radio per option row", () => {
    renderBody();

    const options = screen.getAllByRole("radio");

    expect(options).toHaveLength(4);
    options.forEach((option) => {
      expect(within(option).queryAllByRole("radio")).toHaveLength(0);
    });
  });

  it("keeps the radio indicator input out of the accessibility tree and off the tab order", () => {
    renderBody();

    screen.getAllByRole("radio").forEach((option) => {
      const indicator = option.querySelector("input");

      expect(indicator).toHaveAttribute("aria-hidden", "true");
      expect(indicator).toHaveAttribute("tabindex", "-1");
    });
  });

  it("marks the drafted coordinate as the selected row", () => {
    renderBody({ savedCoordinates: pickedBoth, coordinates: pickedBoth });

    const picked = screen.getByRole("radio", { name: currentName("RX") });

    expect(picked).toHaveAttribute("aria-checked", "true");
    expect(picked).toHaveClass("Mui-selected");
    expect(screen.getByRole("radio", { name: "Scaled" })).not.toHaveClass("Mui-selected");
  });

  it("reports the axis id and the value when an option is picked", () => {
    renderBody();

    fireEvent.click(screen.getByRole("radio", { name: "Female" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(GENDER_AXIS_ID, "Female");
  });
});

describe("LevelSheetBody draft against the applied level", () => {
  it("keeps Current on the level the athlete came in with once the draft moves off it", () => {
    renderBody({ savedCoordinates: pickedBoth, coordinates: draftedScaled });

    const applied = screen.getByRole("radio", { name: currentName("RX") });

    expect(applied).toHaveAttribute("aria-checked", "false");
    expect(applied).not.toHaveClass("Mui-selected");
  });

  it("selects the drafted level without calling it Current", () => {
    renderBody({ savedCoordinates: pickedBoth, coordinates: draftedScaled });

    const drafted = screen.getByRole("radio", { name: "Scaled" });

    expect(drafted).toHaveAttribute("aria-checked", "true");
    expect(drafted).toHaveClass("Mui-selected");
    expect(screen.queryByRole("radio", { name: currentName("Scaled") })).not.toBeInTheDocument();
  });

  it("lets the athlete pick her way back to the level she came in with", () => {
    renderBody({ savedCoordinates: pickedBoth, coordinates: draftedScaled });

    fireEvent.click(screen.getByRole("radio", { name: currentName("RX") }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(LEVEL_AXIS_ID, "RX");
  });

  it("tags nothing Current when the athlete came in with no level at all", () => {
    const { rerender } = renderBody();

    rerender(bodyOf({ coordinates: { [LEVEL_AXIS_ID]: "Scaled" } }));

    expect(screen.queryByText(PICK_CURRENT_LABEL)).not.toBeInTheDocument();
  });

  it("names the saved level as Current once the profile lands under an already open sheet", () => {
    const { rerender } = renderBody();

    expect(screen.queryByText(PICK_CURRENT_LABEL)).not.toBeInTheDocument();

    rerender(bodyOf({ savedCoordinates: pickedBoth, coordinates: pickedBoth }));

    expect(screen.getByRole("radio", { name: currentName("RX") })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: currentName("Female") })).toBeInTheDocument();
  });

  it("never lets a pick made before the profile landed masquerade as Current", () => {
    const { rerender } = renderBody();

    rerender(bodyOf({ coordinates: draftedScaled }));
    rerender(bodyOf({ savedCoordinates: pickedBoth, coordinates: draftedScaled }));

    expect(screen.queryByRole("radio", { name: currentName("Scaled") })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: currentName("RX") })).toBeInTheDocument();
  });
});

describe("LevelSheetBody in-flight state", () => {
  it("locks every option row and the CTA while the apply is in flight", () => {
    renderBody({ coordinates: pickedBoth, isComplete: true, isApplying: true });

    expect(screen.getByRole("radio", { name: "Scaled" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Apply RX · Female" })).toBeDisabled();
  });

  it("tags the drafted rows as applying while the flight runs", () => {
    renderBody({ coordinates: pickedBoth, isComplete: true, isApplying: true });

    expect(screen.getByRole("radio", { name: `RX ${PICK_APPLYING_LABEL}` })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: `Female ${PICK_APPLYING_LABEL}` }),
    ).toBeInTheDocument();
  });
});

describe("LevelSheetBody outcome strip", () => {
  it("renders the failure message with a Retry that re-applies", () => {
    renderBody({
      coordinates: pickedBoth,
      isComplete: true,
      outcome: {
        isApplied: false,
        failedValue: null,
        isOffline: false,
        message: "Couldn't apply. Your level is still RX · Female.",
      },
    });

    const strip = screen.getByRole("alert");

    expect(
      within(strip).getByText("Couldn't apply. Your level is still RX · Female."),
    ).toBeInTheDocument();

    fireEvent.click(within(strip).getByRole("button", { name: PICK_RETRY_LABEL }));

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("renders no strip when there is no outcome", () => {
    renderBody();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
