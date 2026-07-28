import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { render } from "@app/test/render";

import {
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  PICK_CURRENT_LABEL,
  PROFILE_PICKS_NO_AXES,
} from "../utils/athlete-profile.constants";

import { ProfilePicksSection } from "./profile-picks-section";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";
const ORPHAN_AXIS_ID = "clz00000000000000000orph1";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const plainAxis = (id: string, label: string, values: string[]): ProfileAxis => ({
  id,
  key: label.toLowerCase(),
  label,
  values,
  binding: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const genderAxis: ProfileAxis = {
  id: SYSTEM_GENDER_AXIS_ID,
  key: "gender",
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
  createdAt: NOW,
  updatedAt: NOW,
};

const onPick = vi.fn();
const onClearPick = vi.fn();
const onRetry = vi.fn();

const currentName = (value: string): string => `${value} ${PICK_CURRENT_LABEL}`;

const renderSection = (axes: ProfileAxis[], selections: Record<string, string>): void => {
  render(
    <ProfilePicksSection
      axes={axes}
      selections={selections}
      isSaving={false}
      flight={null}
      outcome={null}
      onPick={onPick}
      onClearPick={onClearPick}
      onRetry={onRetry}
    />,
  );
};

beforeEach(() => {
  onPick.mockReset();
  onClearPick.mockReset();
  onRetry.mockReset();
});

describe("ProfilePicksSection groups (Must-Test 7)", () => {
  it("renders one option row per axis value across every binding-null axis", () => {
    renderSection(
      [
        plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
        plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
      ],
      {},
    );

    expect(screen.getByRole("radio", { name: "RX" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "SC" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "M" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "F" })).toBeInTheDocument();
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
  });

  it("renders one radiogroup per axis and exactly one radio per axis value", () => {
    renderSection(
      [
        plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
        plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
      ],
      {},
    );

    expect(screen.getAllByRole("radiogroup")).toHaveLength(2);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("never renders a bound gender axis passed in axes (defensive binding filter)", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]), genderAxis], {});

    expect(screen.getByRole("radio", { name: "RX" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Male" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Female" })).not.toBeInTheDocument();
    expect(screen.queryByText("Gender")).not.toBeInTheDocument();
  });
});

describe("ProfilePicksSection active-marking (Must-Test 8)", () => {
  it("checks the option row by selections[axis.id] === value and tags it Current", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "SC" });

    expect(screen.getByRole("radio", { name: currentName("SC") })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "RX" })).toHaveAttribute("aria-checked", "false");
  });

  it("checks nothing when a stale selection value is not among the axis values", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "GONE" });

    expect(screen.getByRole("radio", { name: "RX" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "SC" })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onPick with the axis id and value, not the label, on click", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], {});

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(LEVEL_AXIS_ID, "RX");
  });
});

describe("ProfilePicksSection clear control (Must-Test 10)", () => {
  it("calls onClearPick with the axis id when the active pick is cleared", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "RX" });

    fireEvent.click(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    );

    expect(onClearPick).toHaveBeenCalledTimes(1);
    expect(onClearPick).toHaveBeenCalledWith(LEVEL_AXIS_ID);
  });

  it("renders the clear control only for an axis card that has an active pick", () => {
    renderSection(
      [
        plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
        plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
      ],
      {
        [LEVEL_AXIS_ID]: "RX",
      },
    );

    expect(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Scale${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("ProfilePicksSection disabled while saving (Must-Test 9)", () => {
  it("locks every option row and the clear control while a write is in flight", () => {
    render(
      <ProfilePicksSection
        axes={[plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])]}
        selections={{ [LEVEL_AXIS_ID]: "RX" }}
        isSaving
        flight={null}
        outcome={null}
        onPick={onPick}
        onClearPick={onClearPick}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("radio", { name: currentName("RX") })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("radio", { name: "SC" })).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    ).toBeDisabled();
  });
});

describe("ProfilePicksSection empty and orphan states (Must-Test 11)", () => {
  it("renders the no-axes message when there are no axes", () => {
    renderSection([], {});

    expect(screen.getByText(PROFILE_PICKS_NO_AXES)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("skips an orphan selection key absent from axes without crashing or a stray row", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], {
      [ORPHAN_AXIS_ID]: "Deleted",
    });

    expect(screen.getByRole("radio", { name: "RX" })).toBeInTheDocument();
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(CLEAR_PICK_ARIA_PREFIX) }),
    ).not.toBeInTheDocument();
  });
});
