import { describe, expect, it } from "vitest";

import { buildChartGeometry, type ChartPoint } from "./build-chart-geometry";

const point = (value: number, valueLabel: string, dateLabel: string): ChartPoint => ({
  value,
  valueLabel,
  dateLabel,
});

describe("buildChartGeometry", () => {
  it("returns empty geometry for an empty series", () => {
    expect(buildChartGeometry([])).toEqual({ poly: "", area: "", dots: [] });
  });

  it("centers a single point and pins it to the vertical mid of the plot", () => {
    const geometry = buildChartGeometry([point(100, "100", "Apr 2026")]);

    expect(geometry.dots).toHaveLength(1);
    expect(geometry.dots[0]?.cx).toBe(300);
    expect(geometry.dots[0]?.cy).toBe(91);
    expect(geometry.dots[0]?.anchor).toBe("start");
  });

  it("spaces multiple points evenly across the plot width", () => {
    const geometry = buildChartGeometry([
      point(150, "150", "Aug 2024"),
      point(170, "170", "Jun 2025"),
      point(180, "180", "Apr 2026"),
    ]);

    expect(geometry.dots.map((dot) => dot.cx)).toEqual([16, 300, 584]);
    expect(geometry.dots.map((dot) => dot.anchor)).toEqual(["start", "middle", "end"]);
  });

  it("maps the max value to the plot top and the min value to the plot bottom", () => {
    const geometry = buildChartGeometry([point(150, "150", "a"), point(180, "180", "b")]);

    expect(geometry.dots[1]?.cy).toBe(30);
    expect(geometry.dots[0]?.cy).toBe(152);
  });

  it("does not produce a degenerate line for a flat series", () => {
    const geometry = buildChartGeometry([point(100, "100", "a"), point(100, "100", "b")]);
    const ys = geometry.dots.map((dot) => dot.cy);

    expect(ys[0]).toBe(91);
    expect(ys[1]).toBe(91);
    expect(geometry.poly).toBe("16,91 584,91");
  });

  it("closes the area polygon down to the baseline at both ends", () => {
    const geometry = buildChartGeometry([point(150, "150", "a"), point(180, "180", "b")]);

    expect(geometry.area).toBe("16,152 16,152 584,30 584,152");
  });

  it("places value labels above the dot and date labels on the baseline row", () => {
    const geometry = buildChartGeometry([point(180, "180", "Apr 2026")]);

    expect(geometry.dots[0]?.valueLabelY).toBe(80);
    expect(geometry.dots[0]?.dateLabelY).toBe(170);
  });
});
