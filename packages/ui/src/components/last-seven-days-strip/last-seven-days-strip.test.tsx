import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type Last7Day } from "@repo/contracts/coaching/coach-athletes";
import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { LastSevenDaysStrip } from "./last-seven-days-strip";

const ANCHOR_MS = Date.UTC(2025, 0, 8);
const DAY_MS = 24 * 60 * 60 * 1000;

const buildDays = (statuses: TodayStatus[]): Last7Day[] =>
  statuses.map((status, index) => ({
    date: new Date(ANCHOR_MS - (statuses.length - 1 - index) * DAY_MS),
    status,
  }));

const getFirstCellMark = (container: HTMLElement): Element => {
  const grid = container.querySelector(".MuiBox-root");

  if (grid === null) {
    throw new Error("grid node missing");
  }

  const firstCell = grid.querySelectorAll(":scope > .MuiStack-root")[0];

  if (firstCell === undefined) {
    throw new Error("first cell missing");
  }

  const mark = firstCell.querySelector(".MuiBox-root");

  if (mark === null) {
    throw new Error("mark node missing");
  }

  return mark;
};

const SEVEN_STATUSES: TodayStatus[] = [
  TodayStatus.COMPLETED,
  TodayStatus.MISSED,
  TodayStatus.REST_DAY,
  TodayStatus.COMPLETED,
  TodayStatus.NO_SCHEDULE,
  TodayStatus.COMPLETED,
  TodayStatus.PENDING,
];

describe("LastSevenDaysStrip", () => {
  it("renders exactly seven day cells", () => {
    const { container } = render(<LastSevenDaysStrip days={buildDays(SEVEN_STATUSES)} />);
    const grid = container.querySelector(".MuiBox-root");

    expect(grid).not.toBeNull();

    if (grid === null) {
      throw new Error("grid node missing");
    }

    const cells = grid.querySelectorAll(":scope > .MuiStack-root");

    expect(cells).toHaveLength(7);
  });

  it("renders a single-letter day label in every cell", () => {
    const { container } = render(<LastSevenDaysStrip days={buildDays(SEVEN_STATUSES)} />);
    const letters = container.querySelectorAll(".MuiTypography-overline");

    expect(letters).toHaveLength(7);

    const validLetters = new Set(["S", "M", "T", "W", "F"]);

    letters.forEach((letter) => {
      expect(validLetters.has(letter.textContent ?? "")).toBe(true);
    });
  });

  it("colors the completed mark with the success palette", () => {
    const days = buildDays([
      TodayStatus.COMPLETED,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
    ]);
    const { container } = render(<LastSevenDaysStrip days={days} />);

    expect(getFirstCellMark(container)).toHaveStyle({
      backgroundColor: theme.palette.success.main,
    });
  });

  it("colors the missed mark with the error palette", () => {
    const days = buildDays([
      TodayStatus.MISSED,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
      TodayStatus.PENDING,
    ]);
    const { container } = render(<LastSevenDaysStrip days={days} />);

    expect(getFirstCellMark(container)).toHaveStyle({
      backgroundColor: theme.palette.error.main,
    });
  });

  it("gives the last cell the accent today ring", () => {
    const { container } = render(<LastSevenDaysStrip days={buildDays(SEVEN_STATUSES)} />);
    const grid = container.querySelector(".MuiBox-root");

    if (grid === null) {
      throw new Error("grid node missing");
    }

    const cells = grid.querySelectorAll(":scope > .MuiStack-root");
    const lastCell = cells[cells.length - 1];

    if (lastCell === undefined) {
      throw new Error("last cell missing");
    }

    expect(lastCell).toHaveStyle({ border: `1px solid ${theme.palette.primary.main}` });
  });

  it("renders the Done, Missed and Rest legend entries", () => {
    render(<LastSevenDaysStrip days={buildDays(SEVEN_STATUSES)} />);

    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("Rest")).toBeInTheDocument();
  });

  it("renders when dates arrive as serialized strings over the wire", () => {
    const wireDays = JSON.parse(JSON.stringify(buildDays(SEVEN_STATUSES))) as Last7Day[];
    const { container } = render(<LastSevenDaysStrip days={wireDays} />);

    const grid = container.querySelector(".MuiBox-root");

    if (grid === null) {
      throw new Error("grid node missing");
    }

    const cells = grid.querySelectorAll(":scope > .MuiStack-root");
    const letters = container.querySelectorAll(".MuiTypography-overline");

    expect(cells).toHaveLength(7);
    expect(letters).toHaveLength(7);
  });
});
