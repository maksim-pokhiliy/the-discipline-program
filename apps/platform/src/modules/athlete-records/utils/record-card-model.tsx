import { type ReactElement } from "react";

import { type SvgIconComponent } from "@mui/icons-material";
import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRounded from "@mui/icons-material/TrendingFlatRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import { type Theme } from "@mui/material";

import { formatResultParts } from "@repo/contracts/lms/_shared";
import { type BenchmarkRecordView, type OneRMRecordView } from "@repo/contracts/lms/records-view";

import { RecordHistoryList } from "../components/record-history-list";

import { DELTA_UNIT_BY_RESULT_TYPE, KG_UNIT } from "./athlete-records.constants";
import { type ChartPoint } from "./build-chart-geometry";
import { formatDelta, formatShortDate } from "./format-records";

export type Trend = {
  Icon: SvgIconComponent;
  color: (theme: Theme) => string;
  deltaText: string | null;
};

export type RecordView = {
  trend: Trend | null;
  series: ChartPoint[];
  history: ReactElement;
};

const ZERO = 0;

const trendIcon = (value: number): SvgIconComponent =>
  value > ZERO ? TrendingUpRounded : value < ZERO ? TrendingDownRounded : TrendingFlatRounded;

export const buildOneRmView = (record: OneRMRecordView): RecordView => ({
  trend: {
    Icon: trendIcon(record.delta),
    color: (theme) =>
      record.delta > ZERO
        ? theme.palette.success.main
        : record.delta < ZERO
          ? theme.palette.error.main
          : theme.palette.text.disabled,
    deltaText: record.delta === ZERO ? null : formatDelta(record.delta, KG_UNIT),
  },
  series: record.series.map((point) => ({
    value: point.valueKg,
    valueLabel: String(point.valueKg),
    dateLabel: formatShortDate(point.recordedAt),
  })),
  history: <RecordHistoryList kind="oneRM" series={record.series} />,
});

const resolveBenchmarkTrend = (record: BenchmarkRecordView): Trend | null => {
  if (record.delta === null) {
    return null;
  }

  const { value, improved } = record.delta;

  return {
    Icon: trendIcon(value),
    color: (theme) =>
      improved
        ? theme.palette.success.main
        : value === ZERO
          ? theme.palette.text.disabled
          : theme.palette.error.main,
    deltaText:
      value === ZERO ? null : formatDelta(value, DELTA_UNIT_BY_RESULT_TYPE[record.resultType]),
  };
};

export const buildBenchmarkView = (record: BenchmarkRecordView): RecordView => ({
  trend: resolveBenchmarkTrend(record),
  series: record.series.map((point) => ({
    value: point.scalar,
    valueLabel: formatResultParts(point.result).value,
    dateLabel: formatShortDate(point.recordedAt),
  })),
  history: <RecordHistoryList kind="benchmark" series={record.series} />,
});
