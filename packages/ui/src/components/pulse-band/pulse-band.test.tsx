import { alpha } from "@mui/material/styles";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { PulseBand } from "./pulse-band";
import { PulseBandCell, type PulseBandCellProps } from "./pulse-band-cell";

const NEUTRAL_FILL_ALPHA = 0.16;

const getCells = (container: HTMLElement): Element[] => {
  const card = container.querySelector(".MuiCard-root");

  if (card === null) {
    throw new Error("pulse band card missing");
  }

  return Array.from(card.children);
};

const getBarFill = (cell: Element): Element => {
  const track = cell.lastElementChild;

  if (track === null || track.firstElementChild === null) {
    throw new Error("pulse bar fill missing");
  }

  return track.firstElementChild;
};

const SAMPLE_CELLS: PulseBandCellProps[] = [
  { value: 3, label: "Need attention", tone: "error", barPct: 18 },
  { value: 12, suffix: " / 20", label: "Trained today", tone: "primary", barPct: 60 },
  { value: 48, label: "Active athletes", tone: "neutral", barPct: 100 },
];

describe("PulseBand", () => {
  it("renders one outlined card with one cell per entry", () => {
    const { container } = render(<PulseBand cells={SAMPLE_CELLS} />);
    const card = container.querySelector(".MuiCard-root");

    expect(card).not.toBeNull();
    expect(card).toHaveClass("MuiPaper-outlined");
    expect(getCells(container)).toHaveLength(SAMPLE_CELLS.length);
  });

  it("lays the cells out in a column-per-cell grid", () => {
    const { container } = render(<PulseBand cells={SAMPLE_CELLS} />);
    const card = container.querySelector(".MuiCard-root");

    expect(card).toHaveStyle({ gridTemplateColumns: "repeat(3, 1fr)" });
  });

  it("renders each cell value and label", () => {
    render(<PulseBand cells={SAMPLE_CELLS} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("Need attention")).toBeInTheDocument();
    expect(screen.getByText("Active athletes")).toBeInTheDocument();
  });
});

describe("PulseBandCell", () => {
  it("renders the value, suffix, and label", () => {
    render(
      <PulseBandCell value={12} suffix=" / 20" label="Trained today" tone="primary" barPct={60} />,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("/ 20")).toBeInTheDocument();
    expect(screen.getByText("Trained today")).toBeInTheDocument();
  });

  it("recolors the number with the palette tone", () => {
    const { container } = render(
      <PulseBandCell value={3} label="Need attention" tone="error" barPct={18} />,
    );
    const number = screen.getByText("3");

    expect(number).toHaveStyle({ color: theme.palette.error.main });
    expect(container).toBeTruthy();
  });

  it("uses the primary text color for the neutral tone number", () => {
    render(<PulseBandCell value={48} label="Active athletes" tone="neutral" barPct={100} />);

    expect(screen.getByText("48")).toHaveStyle({ color: theme.palette.text.primary });
  });

  it("recolors the bar fill with the palette tone", () => {
    const { container } = render(
      <PulseBandCell value={3} label="Need attention" tone="error" barPct={18} />,
    );
    const cell = container.firstElementChild;

    if (cell === null) {
      throw new Error("cell missing");
    }

    expect(getBarFill(cell)).toHaveStyle({ backgroundColor: theme.palette.error.main });
  });

  it("tints the bar fill with white for the neutral tone", () => {
    const { container } = render(
      <PulseBandCell value={48} label="Active athletes" tone="neutral" barPct={100} />,
    );
    const cell = container.firstElementChild;

    if (cell === null) {
      throw new Error("cell missing");
    }

    expect(getBarFill(cell)).toHaveStyle({
      backgroundColor: alpha(theme.palette.common.white, NEUTRAL_FILL_ALPHA),
    });
  });

  it("reflects barPct as the fill width", () => {
    const { container } = render(
      <PulseBandCell value={12} label="Trained today" tone="primary" barPct={60} />,
    );
    const cell = container.firstElementChild;

    if (cell === null) {
      throw new Error("cell missing");
    }

    expect(getBarFill(cell)).toHaveStyle({ width: "60%" });
  });

  it("clamps barPct above 100 to a full-width fill", () => {
    const { container } = render(
      <PulseBandCell value={12} label="Trained today" tone="primary" barPct={140} />,
    );
    const cell = container.firstElementChild;

    if (cell === null) {
      throw new Error("cell missing");
    }

    expect(getBarFill(cell)).toHaveStyle({ width: "100%" });
  });

  it("clamps a negative barPct to an empty fill", () => {
    const { container } = render(
      <PulseBandCell value={0} label="Need attention" tone="error" barPct={-20} />,
    );
    const cell = container.firstElementChild;

    if (cell === null) {
      throw new Error("cell missing");
    }

    expect(getBarFill(cell)).toHaveStyle({ width: "0%" });
  });
});
