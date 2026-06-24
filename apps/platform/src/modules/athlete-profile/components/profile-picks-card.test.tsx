import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { render } from "@app/test/render";

import {
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  PROFILE_PICKS_NO_AXES,
} from "../utils/athlete-profile.constants";

import { ProfilePicksCard } from "./profile-picks-card";

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

const renderCard = (axes: ProfileAxis[], selections: Record<string, string>): void => {
  render(
    <ProfilePicksCard
      axes={axes}
      selections={selections}
      isSaving={false}
      onPick={onPick}
      onClearPick={onClearPick}
    />,
  );
};

beforeEach(() => {
  onPick.mockReset();
  onClearPick.mockReset();
});

describe("ProfilePicksCard groups (Must-Test 7)", () => {
  it("renders one value button per axis value across every binding-null axis", () => {
    renderCard(
      [
        plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
        plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
      ],
      {},
    );

    expect(screen.getByRole("button", { name: "RX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "F" })).toBeInTheDocument();
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
  });

  it("never renders a bound gender axis passed in axes (defensive binding filter)", () => {
    renderCard([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]), genderAxis], {});

    expect(screen.getByRole("button", { name: "RX" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Male" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Female" })).not.toBeInTheDocument();
    expect(screen.queryByText("Gender")).not.toBeInTheDocument();
  });
});

describe("ProfilePicksCard active-marking (Must-Test 8)", () => {
  it("marks the value button active by selections[axis.id] === value (contained vs outlined)", () => {
    renderCard([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "SC" });

    expect(screen.getByRole("button", { name: "SC" })).toHaveClass("MuiButton-contained");
    expect(screen.getByRole("button", { name: "RX" })).toHaveClass("MuiButton-outlined");
  });

  it("highlights nothing when a stale selection value is not among the axis values", () => {
    renderCard([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "GONE" });

    expect(screen.getByRole("button", { name: "RX" })).toHaveClass("MuiButton-outlined");
    expect(screen.getByRole("button", { name: "SC" })).toHaveClass("MuiButton-outlined");
  });

  it("calls onPick with the axis id and value, not the label, on click", () => {
    renderCard([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], {});

    fireEvent.click(screen.getByRole("button", { name: "RX" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(LEVEL_AXIS_ID, "RX");
  });
});

describe("ProfilePicksCard clear control (Must-Test 10)", () => {
  it("calls onClearPick with the axis id when the active pick is cleared", () => {
    renderCard([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "RX" });

    fireEvent.click(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    );

    expect(onClearPick).toHaveBeenCalledTimes(1);
    expect(onClearPick).toHaveBeenCalledWith(LEVEL_AXIS_ID);
  });

  it("renders the clear control only for a group that has an active pick", () => {
    renderCard(
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

describe("ProfilePicksCard disabled while saving (Must-Test 9)", () => {
  it("disables every value button and the clear control while a write is in flight", () => {
    render(
      <ProfilePicksCard
        axes={[plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])]}
        selections={{ [LEVEL_AXIS_ID]: "RX" }}
        isSaving
        onPick={onPick}
        onClearPick={onClearPick}
      />,
    );

    expect(screen.getByRole("button", { name: "RX" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "SC" })).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    ).toBeDisabled();
  });
});

describe("ProfilePicksCard empty and orphan states (Must-Test 11)", () => {
  it("renders the no-axes message when there are no axes", () => {
    renderCard([], {});

    expect(screen.getByText(PROFILE_PICKS_NO_AXES)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("skips an orphan selection key absent from axes without crashing or a stray row", () => {
    renderCard([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [ORPHAN_AXIS_ID]: "Deleted" });

    expect(screen.getByRole("button", { name: "RX" })).toBeInTheDocument();
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(CLEAR_PICK_ARIA_PREFIX) }),
    ).not.toBeInTheDocument();
  });
});
