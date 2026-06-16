import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { DashboardHeaderBand } from "./dashboard-header-band";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardHeaderBand attention pill", () => {
  it("shows the attention count and the Need attention label when items exist", () => {
    render(
      <DashboardHeaderBand
        coachName="Denys"
        needAttentionCount={3}
        onScrollToAttention={vi.fn()}
      />,
    );

    expect(screen.getByText("Coach Denys")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Need attention")).toBeInTheDocument();
  });

  it("scrolls to the attention anchor when the pill is clicked", () => {
    const onScrollToAttention = vi.fn();

    render(
      <DashboardHeaderBand
        coachName="Denys"
        needAttentionCount={3}
        onScrollToAttention={onScrollToAttention}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onScrollToAttention).toHaveBeenCalledTimes(1);
  });

  it("shows All clear with a zero count when nothing needs attention", () => {
    render(
      <DashboardHeaderBand
        coachName="Denys"
        needAttentionCount={0}
        onScrollToAttention={vi.fn()}
      />,
    );

    expect(screen.getByText("All clear")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Need attention")).toBeNull();
  });

  it("falls back to a nameless Coach label when no coach name is supplied", () => {
    render(
      <DashboardHeaderBand coachName={null} needAttentionCount={1} onScrollToAttention={vi.fn()} />,
    );

    expect(screen.getByText("Coach")).toBeInTheDocument();
  });
});
