import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { type RowSummary } from "../lib/format-row";

import { RowSummaryChips } from "./row-summary-chips";

const makeSummary = (overrides: Partial<RowSummary> = {}): RowSummary => ({
  volume: null,
  load: null,
  side: null,
  tempo: null,
  intensityChips: [],
  rest: null,
  modifiers: [],
  notes: [],
  ...overrides,
});

describe("RowSummaryChips", () => {
  it("renders the volume chip when volume is present", () => {
    render(<RowSummaryChips summary={makeSummary({ volume: "4 × 5" })} />);

    expect(screen.getByText("4 × 5")).toBeInTheDocument();
  });

  it("renders the load chip when load is present", () => {
    render(<RowSummaryChips summary={makeSummary({ load: "BW" })} />);

    expect(screen.getByText("BW")).toBeInTheDocument();
  });

  it("renders the side chip when side is present", () => {
    render(<RowSummaryChips summary={makeSummary({ side: "each leg" })} />);

    expect(screen.getByText("each leg")).toBeInTheDocument();
  });

  it("renders the tempo chip when tempo is present", () => {
    render(<RowSummaryChips summary={makeSummary({ tempo: "3-1-1-0" })} />);

    expect(screen.getByText("3-1-1-0")).toBeInTheDocument();
  });

  it("renders one chip per modifier", () => {
    render(<RowSummaryChips summary={makeSummary({ modifiers: ["from sofa", "neutral grip"] })} />);

    expect(screen.getByText("from sofa")).toBeInTheDocument();
    expect(screen.getByText("neutral grip")).toBeInTheDocument();
  });

  it("renders all populated categories together", () => {
    render(
      <RowSummaryChips
        summary={makeSummary({
          volume: "4 × 5",
          load: "BW",
          side: "each leg",
          tempo: "3-1-1-0",
          modifiers: ["from sofa"],
        })}
      />,
    );

    const chips = document.querySelectorAll(".MuiChip-root");

    expect(chips).toHaveLength(5);
  });

  it("renders notes as prose rather than a chip", () => {
    const { container } = render(
      <RowSummaryChips summary={makeSummary({ notes: ["explosive"] })} />,
    );

    expect(screen.getByText("explosive")).toBeInTheDocument();
    expect(container.querySelector(".MuiChip-root")).toBeNull();
  });

  it("joins multiple notes with a middot separator", () => {
    render(<RowSummaryChips summary={makeSummary({ notes: ["explosive", "no belt"] })} />);

    expect(screen.getByText("explosive · no belt")).toBeInTheDocument();
  });

  it("renders nothing when the summary is entirely empty", () => {
    const { container } = render(<RowSummaryChips summary={makeSummary()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
