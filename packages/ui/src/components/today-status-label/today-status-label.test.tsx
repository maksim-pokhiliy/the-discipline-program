import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { TodayStatusLabel } from "./today-status-label";

describe("TodayStatusLabel", () => {
  it("renders the Done label for COMPLETED status", () => {
    render(<TodayStatusLabel status={TodayStatus.COMPLETED} />);

    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders the Missed label for MISSED status", () => {
    render(<TodayStatusLabel status={TodayStatus.MISSED} />);

    expect(screen.getByText("Missed")).toBeInTheDocument();
  });

  it("renders the Pending label for PENDING status", () => {
    render(<TodayStatusLabel status={TodayStatus.PENDING} />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders the Rest label for REST_DAY status", () => {
    render(<TodayStatusLabel status={TodayStatus.REST_DAY} />);

    expect(screen.getByText("Rest")).toBeInTheDocument();
  });

  it("renders an em dash for NO_SCHEDULE status", () => {
    render(<TodayStatusLabel status={TodayStatus.NO_SCHEDULE} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("colors the dot with the success palette for COMPLETED status", () => {
    const { container } = render(<TodayStatusLabel status={TodayStatus.COMPLETED} />);
    const dot = container.querySelector(".MuiBox-root");

    expect(dot).not.toBeNull();
    expect(dot).toHaveStyle({ backgroundColor: theme.palette.success.main });
  });

  it("colors the dot with the error palette for MISSED status", () => {
    const { container } = render(<TodayStatusLabel status={TodayStatus.MISSED} />);
    const dot = container.querySelector(".MuiBox-root");

    expect(dot).not.toBeNull();
    expect(dot).toHaveStyle({ backgroundColor: theme.palette.error.main });
  });

  it("colors the dot with the muted text token for PENDING status", () => {
    const { container } = render(<TodayStatusLabel status={TodayStatus.PENDING} />);
    const dot = container.querySelector(".MuiBox-root");

    expect(dot).not.toBeNull();
    expect(dot).toHaveStyle({ backgroundColor: theme.palette.text.muted });
  });
});
