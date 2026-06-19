import { type ReactElement } from "react";

import { alpha, Box, useTheme } from "@mui/material";

import {
  CHART_AREA_ALPHA,
  CHART_DATE_LABEL_ALPHA,
  CHART_DATE_LABEL_PX,
  CHART_DOT_R,
  CHART_DOT_STROKE_PX,
  CHART_STROKE_PX,
  CHART_VALUE_LABEL_ALPHA,
  CHART_VALUE_LABEL_PX,
  CHART_VIEWBOX_HEIGHT,
  CHART_VIEWBOX_WIDTH,
} from "../utils/athlete-records.constants";
import { buildChartGeometry, type ChartPoint } from "../utils/build-chart-geometry";

const VIEWBOX_ORIGIN = 0;
const PRESERVE_ASPECT_RATIO = "xMidYMid meet";
const SVG_FILL_NONE = "none";

export type TrendChartProps = {
  series: ChartPoint[];
};

export const TrendChart = ({ series }: TrendChartProps): ReactElement => {
  const theme = useTheme();
  const { poly, area, dots } = buildChartGeometry(series);
  const accent = theme.palette.primary.main;
  const dotFill = theme.palette.background.sunken;
  const valueColor = alpha(theme.palette.common.white, CHART_VALUE_LABEL_ALPHA);
  const dateColor = alpha(theme.palette.common.white, CHART_DATE_LABEL_ALPHA);
  const viewBox = `${VIEWBOX_ORIGIN} ${VIEWBOX_ORIGIN} ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`;

  return (
    <Box
      component="svg"
      viewBox={viewBox}
      preserveAspectRatio={PRESERVE_ASPECT_RATIO}
      sx={{ width: "100%", height: "auto", display: "block" }}
    >
      <polygon points={area} fill={alpha(accent, CHART_AREA_ALPHA)} stroke={SVG_FILL_NONE} />
      <polyline
        points={poly}
        fill={SVG_FILL_NONE}
        stroke={accent}
        strokeWidth={CHART_STROKE_PX}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {dots.map((dot) => (
        <g key={`${dot.cx}-${dot.cy}`}>
          <circle
            cx={dot.cx}
            cy={dot.cy}
            r={CHART_DOT_R}
            fill={dotFill}
            stroke={accent}
            strokeWidth={CHART_DOT_STROKE_PX}
          />
          <text
            x={dot.cx}
            y={dot.valueLabelY}
            textAnchor={dot.anchor}
            fontFamily={theme.typography.h4.fontFamily}
            fontWeight={theme.typography.h4.fontWeight}
            fontSize={CHART_VALUE_LABEL_PX}
            fill={valueColor}
          >
            {dot.valueLabel}
          </text>
          <text
            x={dot.cx}
            y={dot.dateLabelY}
            textAnchor={dot.anchor}
            fontFamily={theme.typography.body1.fontFamily}
            fontSize={CHART_DATE_LABEL_PX}
            fill={dateColor}
          >
            {dot.dateLabel}
          </text>
        </g>
      ))}
    </Box>
  );
};
