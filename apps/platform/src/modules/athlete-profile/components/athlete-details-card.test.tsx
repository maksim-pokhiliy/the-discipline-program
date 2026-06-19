import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import {
  Gender,
  GENDER_LABELS,
  HealthStatus,
  HEALTH_STATUS_LABELS,
} from "@repo/contracts/coaching/athlete-profile";

import { render } from "@app/test/render";

import {
  GENDER_FIELD_LABEL,
  HEALTH_NOTE_FIELD_LABEL,
  HEALTH_STATUS_FIELD_LABEL,
} from "../utils/athlete-profile.constants";

import { AthleteDetailsCard } from "./athlete-details-card";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const renderCard = (overrides: Partial<Parameters<typeof AthleteDetailsCard>[0]> = {}): void => {
  render(
    <AthleteDetailsCard
      gender={null}
      healthStatus={HealthStatus.HEALTHY}
      healthNote={null}
      isSaving={false}
      onChange={onChange}
      {...overrides}
    />,
  );
};

const selectOption = (fieldLabel: string, optionName: string): void => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: fieldLabel }));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: optionName }));
};

describe("AthleteDetailsCard gender", () => {
  it("emits onChange with the chosen gender when an option is selected", () => {
    renderCard({ gender: null });

    selectOption(GENDER_FIELD_LABEL, GENDER_LABELS[Gender.MALE]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ gender: Gender.MALE });
  });

  it("offers only Male and Female with no clear-gender option once set", () => {
    renderCard({ gender: Gender.MALE });

    fireEvent.mouseDown(screen.getByRole("combobox", { name: GENDER_FIELD_LABEL }));

    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    expect(options).toHaveLength(2);
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: GENDER_LABELS[Gender.MALE] }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: GENDER_LABELS[Gender.FEMALE],
      }),
    ).toBeInTheDocument();
  });
});

describe("AthleteDetailsCard health status", () => {
  it("emits onChange with the chosen status when an option is selected", () => {
    renderCard({ healthStatus: HealthStatus.HEALTHY });

    selectOption(HEALTH_STATUS_FIELD_LABEL, HEALTH_STATUS_LABELS[HealthStatus.INJURED]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ healthStatus: HealthStatus.INJURED });
  });

  it("renders the HealthStatusChip preview for a non-HEALTHY status", () => {
    renderCard({ healthStatus: HealthStatus.INJURED });

    expect(screen.getAllByText(HEALTH_STATUS_LABELS[HealthStatus.INJURED])).toHaveLength(2);
  });

  it("renders no HealthStatusChip preview for a HEALTHY status", () => {
    renderCard({ healthStatus: HealthStatus.HEALTHY });

    expect(screen.getAllByText(HEALTH_STATUS_LABELS[HealthStatus.HEALTHY])).toHaveLength(1);
  });
});

describe("AthleteDetailsCard health note", () => {
  it("emits onChange with the trimmed note text on blur after a change", () => {
    renderCard({ healthNote: null });

    const note = screen.getByRole("textbox", { name: HEALTH_NOTE_FIELD_LABEL });

    fireEvent.change(note, { target: { value: "  left knee tweak  " } });
    fireEvent.blur(note);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ healthNote: "left knee tweak" });
  });

  it("emits onChange with null when an existing note is cleared and blurred", () => {
    renderCard({ healthNote: "old note" });

    const note = screen.getByRole("textbox", { name: HEALTH_NOTE_FIELD_LABEL });

    fireEvent.change(note, { target: { value: "" } });
    fireEvent.blur(note);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ healthNote: null });
  });

  it("does not emit onChange when the note is blurred without a change", () => {
    renderCard({ healthNote: "unchanged" });

    fireEvent.blur(screen.getByRole("textbox", { name: HEALTH_NOTE_FIELD_LABEL }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("AthleteDetailsCard scope", () => {
  it("renders no height field (height lives in its own stat card)", () => {
    renderCard();

    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByRole("combobox", { name: /height/i })).toBeNull();
  });

  it("disables every control while a save is in flight", () => {
    renderCard({ isSaving: true });

    expect(screen.getByRole("combobox", { name: GENDER_FIELD_LABEL })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("combobox", { name: HEALTH_STATUS_FIELD_LABEL })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("textbox", { name: HEALTH_NOTE_FIELD_LABEL })).toBeDisabled();
  });
});
