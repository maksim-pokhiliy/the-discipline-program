import { type ReactElement } from "react";

import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRounded from "@mui/icons-material/TrendingFlatRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import { type Theme } from "@mui/material";

import { formatResultParts } from "@repo/contracts/lms/_shared";
import { type BenchmarkRecordView, type OneRMRecordView } from "@repo/contracts/lms/records-view";

import { RecordHistoryList } from "../components/record-history-list";

import { DELTA_UNIT_BY_RESULT_TYPE, KG_UNIT } from "./athlete-records.constants";
import { type ChartPoint } from "./build-chart-geometry";
import { formatMagnitude, formatShortDate } from "./format-records";

type IconComponent = typeof TrendingUpRounded;

export type Trend = {
  Icon: IconComponent;
  color: (theme: Theme) => string;
  deltaText: string | null;
};

export type RecordView = {
  trend: Trend | null;
  series: ChartPoint[];
  history: ReactElement;
};

const ZERO = 0;

const improvementIcon = (improved: boolean, isFlat: boolean): IconComponent =>
  improved ? TrendingUpRounded : isFlat ? TrendingFlatRounded : TrendingDownRounded;

const improvementColor =
  (improved: boolean, isFlat: boolean) =>
  (theme: Theme): string =>
    improved
      ? theme.palette.success.main
      : isFlat
        ? theme.palette.text.disabled
        : theme.palette.error.main;

export const buildOneRmView = (record: OneRMRecordView): RecordView => {
  const improved = record.delta > ZERO;
  const isFlat = record.delta === ZERO;

  return {
    trend: {
      Icon: improvementIcon(improved, isFlat),
      color: improvementColor(improved, isFlat),
      deltaText: isFlat ? null : formatMagnitude(record.delta, KG_UNIT),
    },
    series: record.series.map((point) => ({
      value: point.valueKg,
      valueLabel: String(point.valueKg),
      dateLabel: formatShortDate(point.recordedAt),
    })),
    history: <RecordHistoryList kind="oneRM" series={record.series} />,
  };
};

const resolveBenchmarkTrend = (record: BenchmarkRecordView): Trend | null => {
  if (record.delta === null) {
    return null;
  }

  const { value, improved } = record.delta;
  const isFlat = value === ZERO;

  return {
    Icon: improvementIcon(improved, isFlat),
    color: improvementColor(improved, isFlat),
    deltaText: isFlat ? null : formatMagnitude(value, DELTA_UNIT_BY_RESULT_TYPE[record.resultType]),
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
