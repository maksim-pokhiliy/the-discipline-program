import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type ResolvedLoad,
  type ResolvedLoadSource,
  type RowView,
} from "@repo/contracts/lms/session-detail";

import { render } from "@app/test/render";

import { MAX_HELPER_WITH_RECORD } from "../utils/weight-sheet.constants";

import { MaxSheetBody } from "./max-sheet-body";

const EXERCISE_ID = "clz000000000000000000ex01";
const RECORDED_AT = "2026-07-12T10:00:00.000Z";

const PERCENTAGE_LOAD: Load = {
  kind: "percentage",
  value: 80,
  reference: { scope: "self" },
};

const RANGE_LOAD: Load = {
  kind: "percentage",
  value: 70,
  rangeMax: 80,
  reference: { scope: "self" },
};

const oneRmSource = (
  overrides: Partial<Extract<ResolvedLoadSource, { kind: "one_rm" }>> = {},
): ResolvedLoadSource => ({
  kind: "one_rm",
  exerciseId: EXERCISE_ID,
  percent: 80,
  baseKg: 120,
  recordedAt: RECORDED_AT,
  recordSource: OneRMRecordSource.MANUAL,
  ...overrides,
});

const resolved = (source: ResolvedLoadSource): ResolvedLoad => ({
  status: "resolved",
  kg: 96,
  perHand: false,
  source,
});

const MISSING_ONE_RM: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_one_rm",
  prompt: "set_one_rm",
  exerciseId: EXERCISE_ID,
};

const row = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: "clz0000000000000000000row1",
  movement: "Back Squat",
  media: null,
  sets: null,
  reps: null,
  load: PERCENTAGE_LOAD,
  resolvedLoad: resolved(oneRmSource()),
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
  ...overrides,
});

const onChange = vi.fn();
const onSave = vi.fn();
const onCancel = vi.fn();

type BodyState = {
  row?: RowView;
  value?: string;
  isSaving?: boolean;
  canSave?: boolean;
};

const renderBody = (state: BodyState = {}): void => {
  render(
    <MaxSheetBody
      row={state.row ?? row()}
      value={state.value ?? ""}
      isSaving={state.isSaving ?? false}
      canSave={state.canSave ?? false}
      onChange={onChange}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );
};

const maxInput = (): HTMLElement => screen.getByLabelText("New 1RM (kg)");

beforeEach(() => {
  onChange.mockReset();
  onSave.mockReset();
  onCancel.mockReset();
});

describe("MaxSheetBody header", () => {
  it("states the percentage the plan asks for", () => {
    renderBody();

    expect(screen.getByText("This plan asks for 80% of it.")).toBeInTheDocument();
  });

  it("renders the authored range when the row resolves against a range", () => {
    renderBody({
      row: row({
        load: RANGE_LOAD,
        resolvedLoad: resolved(oneRmSource({ percent: 70, percentMax: 80 })),
      }),
    });

    expect(screen.getByText("This plan asks for 70–80% of it.")).toBeInTheDocument();
  });

  it("reads the percentage off the authored load when there is no record", () => {
    renderBody({ row: row({ load: RANGE_LOAD, resolvedLoad: MISSING_ONE_RM }) });

    expect(screen.getByText("This plan asks for 70–80% of it.")).toBeInTheDocument();
  });
});

describe("MaxSheetBody context strip", () => {
  it("names the base weight, the record date and the record source", () => {
    renderBody();

    expect(screen.getByText("Latest record · 120 kg · 12 Jul 2026")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("labels a tested record", () => {
    renderBody({
      row: row({
        resolvedLoad: resolved(oneRmSource({ recordSource: OneRMRecordSource.TESTED })),
      }),
    });

    expect(screen.getByText("Tested")).toBeInTheDocument();
  });

  it("labels an auto-inferred record", () => {
    renderBody({
      row: row({
        resolvedLoad: resolved(oneRmSource({ recordSource: OneRMRecordSource.AUTO_INFERRED })),
      }),
    });

    expect(screen.getByText("Auto-inferred")).toBeInTheDocument();
  });

  it("renders no strip when the row has no record behind it", () => {
    renderBody({ row: row({ resolvedLoad: MISSING_ONE_RM }) });

    expect(screen.queryByText(/Latest record/)).not.toBeInTheDocument();
  });
});

describe("MaxSheetBody field and helper", () => {
  it("offers a decimal keypad on an empty field with a zero placeholder", () => {
    renderBody();

    expect(maxInput()).toHaveAttribute("inputmode", "decimal");
    expect(maxInput()).toHaveAttribute("placeholder", "0");
    expect(maxInput()).toHaveValue("");
  });

  it("explains that a correction appends a newer record when one exists", () => {
    renderBody();

    expect(
      screen.getByText(
        "Corrections add a newer record — the latest wins. Full history lives on Records.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(MAX_HELPER_WITH_RECORD)).toBeInTheDocument();
  });

  it("names the movement in the helper when there is no record yet", () => {
    renderBody({ row: row({ resolvedLoad: MISSING_ONE_RM }) });

    expect(
      screen.getByText(
        "Used wherever this plan asks for a % of your Back Squat. You can correct it any time.",
      ),
    ).toBeInTheDocument();
  });

  it("reports every keystroke", () => {
    renderBody();

    fireEvent.change(maxInput(), { target: { value: "125" } });

    expect(onChange).toHaveBeenCalledWith("125");
  });
});

describe("MaxSheetBody actions", () => {
  it("names the weight on the save CTA once the value parses", () => {
    renderBody({ value: "125", canSave: true });

    const save = screen.getByRole("button", { name: "Save 125 kg" });

    expect(save).toBeEnabled();

    fireEvent.click(save);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("asks for a weight while the field is empty and refuses the save", () => {
    renderBody();

    expect(screen.getByRole("button", { name: "Enter weight" })).toBeDisabled();
  });

  it("refuses the save while a write is in flight", () => {
    renderBody({ value: "125", canSave: true, isSaving: true });

    expect(screen.getByRole("button", { name: "Save 125 kg" })).toBeDisabled();
    expect(maxInput()).toBeDisabled();
  });

  it("offers Cancel", () => {
    renderBody();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
