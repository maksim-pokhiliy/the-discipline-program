import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { render } from "@app/test/render";

import {
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  PICK_APPLYING_LABEL,
  PICK_CURRENT_LABEL,
  PICK_NOT_PICKED_HELPER,
  PICK_NOT_PICKED_LABEL,
  PICK_RETRY_LABEL,
  PROFILE_PICKS_NO_AXES,
} from "../utils/athlete-profile.constants";
import {
  type LevelSwitchFlight,
  type LevelSwitchOutcomes,
} from "../utils/use-profile-level-switch";

import { ProfilePicksSection } from "./profile-picks-section";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";
const ORPHAN_AXIS_ID = "clz00000000000000000orph1";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const APPLIED_MESSAGE = "Applied — training weights everywhere now resolve as RX · Female.";
const FAILED_MESSAGE = "Couldn't apply. Your level is still SC · Female.";

const LONG_VALUE = "Advanced masters competitor scaled";
const LONG_VALUE_SHORTENED = "Advanced masters competitor…";

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
const applyingName = (value: string): string => `${value} ${PICK_APPLYING_LABEL}`;

type SectionState = {
  isSaving?: boolean;
  flight?: LevelSwitchFlight | null;
  outcomes?: LevelSwitchOutcomes;
};

const renderSection = (
  axes: ProfileAxis[],
  selections: Record<string, string>,
  state: SectionState = {},
): void => {
  render(
    <ProfilePicksSection
      axes={axes}
      selections={selections}
      isSaving={state.isSaving ?? false}
      flight={state.flight ?? null}
      outcomes={state.outcomes ?? {}}
      onPick={onPick}
      onClearPick={onClearPick}
      onRetry={onRetry}
    />,
  );
};

const axisCard = (label: string): HTMLElement => {
  const card = screen.getByRole("radiogroup", { name: label }).parentElement;

  if (card === null) {
    throw new Error(`no axis card rendered around the ${label} radiogroup`);
  }

  return card;
};

const axisStateChip = (label: string): HTMLElement => {
  const chip = axisCard(label).querySelector<HTMLElement>(".MuiChip-root");

  if (chip === null) {
    throw new Error(`no state chip rendered in the ${label} axis card`);
  }

  return chip;
};

const clearControl = (label: string): HTMLElement =>
  screen.getByRole("button", {
    name: `${CLEAR_PICK_ARIA_PREFIX}${label}${CLEAR_PICK_ARIA_SUFFIX}`,
  });

const checkedRadios = (): HTMLElement[] =>
  screen.getAllByRole("radio").filter((radio) => radio.getAttribute("aria-checked") === "true");

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

  it("offers no clear control for a stale pick, so the card never contradicts its own chip", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "GONE" });

    expect(screen.getByText(PICK_NOT_PICKED_LABEL)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(CLEAR_PICK_ARIA_PREFIX) }),
    ).not.toBeInTheDocument();
  });

  it("calls onPick with the axis id and value, not the label, on click", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], {});

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(LEVEL_AXIS_ID, "RX");
  });

  it("calls nothing when the row that is already current is tapped", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "RX" });

    fireEvent.click(screen.getByRole("radio", { name: currentName("RX") }));

    expect(onPick).not.toHaveBeenCalled();
    expect(onClearPick).not.toHaveBeenCalled();
  });
});

describe("ProfilePicksSection in-flight switch (H1 invariant)", () => {
  it("keeps the previous row Current while the tapped row is applying", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "SC" },
      { flight: { axisId: LEVEL_AXIS_ID, value: "RX", previousValue: "SC" } },
    );

    expect(screen.getByRole("radio", { name: currentName("SC") })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: applyingName("RX") })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("leaves exactly one row checked for the whole flight", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "SC" },
      { flight: { axisId: LEVEL_AXIS_ID, value: "RX", previousValue: "SC" } },
    );

    expect(checkedRadios()).toHaveLength(1);
    expect(checkedRadios()[0]).toHaveAccessibleName(currentName("SC"));
  });

  it("shows a busy clear control and no Applying tag while a clear is in flight", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "RX" },
      { flight: { axisId: LEVEL_AXIS_ID, value: null, previousValue: "RX" } },
    );

    expect(within(clearControl("Level")).getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(PICK_APPLYING_LABEL)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: currentName("RX") })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

describe("ProfilePicksSection clear control (Must-Test 10)", () => {
  it("calls onClearPick with the axis id when the active pick is cleared", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "RX" });

    fireEvent.click(clearControl("Level"));

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

    expect(clearControl("Level")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Scale${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("ProfilePicksSection disabled while saving (Must-Test 9)", () => {
  it("locks every option row and the clear control while a write is in flight", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "RX" },
      {
        isSaving: true,
      },
    );

    expect(screen.getByRole("radio", { name: currentName("RX") })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("radio", { name: "SC" })).toHaveAttribute("aria-disabled", "true");
    expect(clearControl("Level")).toBeDisabled();
  });

  it("swallows a click on a locked row instead of calling onPick", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "RX" },
      {
        isSaving: true,
      },
    );

    fireEvent.click(screen.getByRole("radio", { name: "SC" }));

    expect(onPick).not.toHaveBeenCalled();
  });
});

describe("ProfilePicksSection outcome strip", () => {
  it("renders the applied message with no Retry when the outcome is a success", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "RX" },
      { outcomes: { [LEVEL_AXIS_ID]: { isApplied: true, message: APPLIED_MESSAGE } } },
    );

    const strip = screen.getByRole("alert");

    expect(within(strip).getByText(APPLIED_MESSAGE)).toBeInTheDocument();
    expect(within(strip).queryByRole("button", { name: PICK_RETRY_LABEL })).not.toBeInTheDocument();
  });

  it("renders the failure message with a Retry that calls onRetry", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "SC" },
      {
        outcomes: {
          [LEVEL_AXIS_ID]: {
            isApplied: false,
            message: FAILED_MESSAGE,
            failedValue: "RX",
            isOffline: false,
          },
        },
      },
    );

    const strip = screen.getByRole("alert");

    expect(within(strip).getByText(FAILED_MESSAGE)).toBeInTheDocument();

    fireEvent.click(within(strip).getByRole("button", { name: PICK_RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(LEVEL_AXIS_ID);
  });

  it("disables Retry while a write is in flight", () => {
    renderSection(
      [plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])],
      { [LEVEL_AXIS_ID]: "SC" },
      {
        isSaving: true,
        outcomes: {
          [LEVEL_AXIS_ID]: {
            isApplied: false,
            message: FAILED_MESSAGE,
            failedValue: "RX",
            isOffline: false,
          },
        },
      },
    );

    expect(screen.getByRole("button", { name: PICK_RETRY_LABEL })).toBeDisabled();
  });

  it("keeps an outcome belonging to another axis out of this axis card", () => {
    renderSection(
      [
        plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
        plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
      ],
      { [SCALE_AXIS_ID]: "M" },
      { outcomes: { [SCALE_AXIS_ID]: { isApplied: true, message: APPLIED_MESSAGE } } },
    );

    expect(within(axisCard("Level")).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(axisCard("Scale")).getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("renders a strip in each axis card when both axes carry an outcome", () => {
    renderSection(
      [
        plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
        plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
      ],
      { [SCALE_AXIS_ID]: "M" },
      {
        outcomes: {
          [LEVEL_AXIS_ID]: {
            isApplied: false,
            message: FAILED_MESSAGE,
            failedValue: "RX",
            isOffline: false,
          },
          [SCALE_AXIS_ID]: { isApplied: true, message: APPLIED_MESSAGE },
        },
      },
    );

    expect(within(axisCard("Level")).getByText(FAILED_MESSAGE)).toBeInTheDocument();
    expect(within(axisCard("Scale")).getByText(APPLIED_MESSAGE)).toBeInTheDocument();

    fireEvent.click(within(axisCard("Level")).getByRole("button", { name: PICK_RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledWith(LEVEL_AXIS_ID);
  });
});

describe("ProfilePicksSection axis header state", () => {
  it("names the picked value in the axis state chip", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], { [LEVEL_AXIS_ID]: "RX" });

    expect(axisStateChip("Level")).toHaveTextContent("RX");
    expect(within(axisCard("Level")).queryByText(PICK_NOT_PICKED_HELPER)).not.toBeInTheDocument();
  });

  it("warns Not picked and explains the consequence for an unpicked axis", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])], {});

    expect(axisStateChip("Level")).toHaveTextContent(PICK_NOT_PICKED_LABEL);
    expect(within(axisCard("Level")).getByText(PICK_NOT_PICKED_HELPER)).toBeInTheDocument();
  });

  it("ellipsizes a long picked value in the chip while the row keeps it in full", () => {
    renderSection([plainAxis(LEVEL_AXIS_ID, "Level", [LONG_VALUE, "SC"])], {
      [LEVEL_AXIS_ID]: LONG_VALUE,
    });

    expect(axisStateChip("Level")).toHaveTextContent(LONG_VALUE_SHORTENED);
    expect(screen.getByRole("radio", { name: currentName(LONG_VALUE) })).toBeInTheDocument();
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
