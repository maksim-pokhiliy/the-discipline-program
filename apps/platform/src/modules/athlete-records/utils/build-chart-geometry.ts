import {
  CHART_ANCHOR_END,
  CHART_ANCHOR_MIDDLE,
  CHART_ANCHOR_START,
  CHART_COORD_PRECISION,
  CHART_DATE_LABEL_OFFSET_PX,
  CHART_FLAT_SERIES_PAD,
  CHART_PAD_BOTTOM,
  CHART_PAD_LEFT,
  CHART_PAD_RIGHT,
  CHART_PAD_TOP,
  CHART_SINGLE_POINT_DIVISOR,
  CHART_VALUE_LABEL_OFFSET_PX,
  CHART_VIEWBOX_HEIGHT,
  CHART_VIEWBOX_WIDTH,
} from "./athlete-records.constants";

export type ChartPoint = {
  value: number;
  valueLabel: string;
  dateLabel: string;
};

export type ChartDot = {
  cx: number;
  cy: number;
  valueLabel: string;
  dateLabel: string;
  valueLabelY: number;
  dateLabelY: number;
  anchor: string;
};

export type ChartGeometry = {
  poly: string;
  area: string;
  dots: ChartDot[];
};

const SINGLE_POINT = 1;
const FIRST_INDEX = 0;
const POINT_SEPARATOR = " ";
const COORD_SEPARATOR = ",";

const PLOT_WIDTH = CHART_VIEWBOX_WIDTH - CHART_PAD_LEFT - CHART_PAD_RIGHT;
const PLOT_HEIGHT = CHART_VIEWBOX_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
const BASELINE_Y = CHART_PAD_TOP + PLOT_HEIGHT;
const EMPTY_GEOMETRY: ChartGeometry = { poly: "", area: "", dots: [] };

const round = (value: number): number => Number(value.toFixed(CHART_COORD_PRECISION));

const resolveBounds = (values: number[]): { min: number; max: number } => {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return { min: min - CHART_FLAT_SERIES_PAD, max: max + CHART_FLAT_SERIES_PAD };
  }

  return { min, max };
};

const resolveX = (index: number, count: number): number =>
  count === SINGLE_POINT
    ? CHART_PAD_LEFT + PLOT_WIDTH / CHART_SINGLE_POINT_DIVISOR
    : CHART_PAD_LEFT + (index / (count - SINGLE_POINT)) * PLOT_WIDTH;

const resolveAnchor = (index: number, count: number): string => {
  if (index === FIRST_INDEX) {
    return CHART_ANCHOR_START;
  }

  if (index === count - SINGLE_POINT) {
    return CHART_ANCHOR_END;
  }

  return CHART_ANCHOR_MIDDLE;
};

export const buildChartGeometry = (series: ChartPoint[]): ChartGeometry => {
  const count = series.length;

  if (count === FIRST_INDEX) {
    return EMPTY_GEOMETRY;
  }

  const { min, max } = resolveBounds(series.map((point) => point.value));
  const range = max - min;

  const dots = series.map((point, index): ChartDot => {
    const y = CHART_PAD_TOP + PLOT_HEIGHT * (SINGLE_POINT - (point.value - min) / range);

    return {
      cx: round(resolveX(index, count)),
      cy: round(y),
      valueLabel: point.valueLabel,
      dateLabel: point.dateLabel,
      valueLabelY: round(y - CHART_VALUE_LABEL_OFFSET_PX),
      dateLabelY: BASELINE_Y + CHART_DATE_LABEL_OFFSET_PX,
      anchor: resolveAnchor(index, count),
    };
  });

  const poly = dots.map((dot) => `${dot.cx}${COORD_SEPARATOR}${dot.cy}`).join(POINT_SEPARATOR);
  const firstX = round(resolveX(FIRST_INDEX, count));
  const lastX = round(resolveX(count - SINGLE_POINT, count));
  const area = `${firstX}${COORD_SEPARATOR}${BASELINE_Y}${POINT_SEPARATOR}${poly}${POINT_SEPARATOR}${lastX}${COORD_SEPARATOR}${BASELINE_Y}`;

  return { poly, area, dots };
};
