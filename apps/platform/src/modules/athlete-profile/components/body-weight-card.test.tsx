import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import {
  BODY_WEIGHT_CANCEL_LABEL,
  BODY_WEIGHT_EMPTY_TITLE,
  BODY_WEIGHT_SAVE_LABEL,
  BODY_WEIGHT_SET_LABEL,
  KG_LABEL,
} from "../utils/athlete-profile.constants";

import { BodyWeightCard } from "./body-weight-card";

const onSave: Mock = vi.fn();

afterEach(() => {
  onSave.mockReset();
});

const startEditing = (): void => {
  fireEvent.click(screen.getByRole("button", { name: /edit|set/i }));
};

describe("BodyWeightCard display state", () => {
  it("shows the value and the kg unit when a weight is set", () => {
    render(<BodyWeightCard weightKg={74.3} isSaving={false} onSave={onSave} />);

    expect(screen.getByText("74.3")).toBeInTheDocument();
    expect(screen.getByText(KG_LABEL)).toBeInTheDocument();
  });
});

describe("BodyWeightCard empty state", () => {
  it("shows the not-set state with a Set weight action when weight is null", () => {
    render(<BodyWeightCard weightKg={null} isSaving={false} onSave={onSave} />);

    expect(screen.getByText(BODY_WEIGHT_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BODY_WEIGHT_SET_LABEL })).toBeInTheDocument();
  });
});

describe("BodyWeightCard editing state", () => {
  it("seeds the field with the current weight when editing starts from a set value", () => {
    render(<BodyWeightCard weightKg={82.5} isSaving={false} onSave={onSave} />);

    startEditing();

    expect(screen.getByRole("spinbutton")).toHaveValue(82.5);
  });

  it("exposes Save and Cancel but no clear-weight control", () => {
    render(<BodyWeightCard weightKg={82.5} isSaving={false} onSave={onSave} />);

    startEditing();

    expect(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BODY_WEIGHT_CANCEL_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear|remove/i })).toBeNull();
  });

  it("disables Save while a save is in flight even with a valid draft", () => {
    render(<BodyWeightCard weightKg={82.5} isSaving={true} onSave={onSave} />);

    startEditing();

    expect(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL })).toBeDisabled();
  });

  it("returns to the display state on Cancel without saving", () => {
    render(<BodyWeightCard weightKg={82.5} isSaving={false} onSave={onSave} />);

    startEditing();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: BODY_WEIGHT_CANCEL_LABEL }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("82.5")).toBeInTheDocument();
  });
});

describe("BodyWeightCard save parsing", () => {
  it.each([
    ["a plain decimal", "73.2", 73.2],
    ["rounding to one decimal", "73.26", 73.3],
    ["clamping above the max", "640", 500],
    ["the exact max", "500", 500],
  ])("saves %s as %s", (_label, input, expected) => {
    render(<BodyWeightCard weightKg={80} isSaving={false} onSave={onSave} />);

    startEditing();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: input } });
    fireEvent.click(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expected);
  });

  it.each([
    ["zero", "0"],
    ["a negative number", "-12"],
    ["a non-numeric string", "abc"],
    ["an empty string", ""],
  ])("disables Save and rejects %s", (_label, input) => {
    render(<BodyWeightCard weightKg={80} isSaving={false} onSave={onSave} />);

    startEditing();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: input } });

    const saveButton = screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL });

    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);

    expect(onSave).not.toHaveBeenCalled();
  });
});
