import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../test/render";

import { PulseStatsCard } from "./pulse-stats-card";

describe("PulseStatsCard empty state", () => {
  it("mounts without crashing when stats array is empty", () => {
    expect(() => render(<PulseStatsCard stats={[]} />)).not.toThrow();
  });

  it("renders no stat labels when stats array is empty", () => {
    render(<PulseStatsCard stats={[]} />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders zero values without producing NaN", () => {
    render(
      <PulseStatsCard
        stats={[
          { value: 0, label: "Active", tooltip: "Active athletes", color: "primary" },
          { value: 0, label: "Total", tooltip: "Total athletes", color: "secondary" },
        ]}
      />,
    );

    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.queryByText("NaN")).not.toBeInTheDocument();
  });
});
