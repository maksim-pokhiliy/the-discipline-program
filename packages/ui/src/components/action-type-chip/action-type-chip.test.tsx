import { alpha } from "@mui/material/styles";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { ActionTypeChip } from "./action-type-chip";

const TYPE_TINT = 0.18;

describe("ActionTypeChip", () => {
  it("renders the Health label and the LocalHospital icon for HEALTH_REPORT", () => {
    const { container } = render(<ActionTypeChip type={ActionItemType.HEALTH_REPORT} />);

    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(container.querySelector('[data-testid="LocalHospitalIcon"]')).not.toBeNull();
  });

  it("renders the Missed label and the EventBusy icon for MISSED_WORKOUTS", () => {
    const { container } = render(<ActionTypeChip type={ActionItemType.MISSED_WORKOUTS} />);

    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(container.querySelector('[data-testid="EventBusyIcon"]')).not.toBeNull();
  });

  it("tints HEALTH_REPORT with the error palette family", () => {
    render(<ActionTypeChip type={ActionItemType.HEALTH_REPORT} />);
    const chip = screen.getByText("Health");

    expect(chip).toHaveStyle({
      backgroundColor: alpha(theme.palette.error.main, TYPE_TINT),
      color: theme.palette.error.main,
    });
  });

  it("tints MISSED_WORKOUTS with the warning palette family", () => {
    render(<ActionTypeChip type={ActionItemType.MISSED_WORKOUTS} />);
    const chip = screen.getByText("Missed");

    expect(chip).toHaveStyle({
      backgroundColor: alpha(theme.palette.warning.main, TYPE_TINT),
      color: theme.palette.warning.main,
    });
  });
});
