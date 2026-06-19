import { type ReactElement } from "react";

import { alpha, Stack, Typography } from "@mui/material";

import { formatResultParts } from "@repo/contracts/lms/_shared";
import { type OneRMRecordSourceValue } from "@repo/contracts/lms/one-rm-record";
import { type BenchmarkSeriesPoint, type OneRMSeriesPoint } from "@repo/contracts/lms/records-view";

import {
  CARD_DATE_PX,
  CURRENT_PR_CHIP_LABEL,
  FONT_WEIGHT_MEDIUM,
  HISTORY_DIVIDER_ALPHA,
  HISTORY_ROW_GAP,
  HISTORY_ROW_PADDING_Y_PX,
  HISTORY_VALUE_GAP,
  HISTORY_VALUE_PX,
  KG_UNIT,
  PR_CHIP_LABEL,
} from "../utils/athlete-records.constants";
import { formatLongDate } from "../utils/format-records";

import { DisplayNumber } from "./display-number";
import { PrChip } from "./pr-chip";
import { SourceChip } from "./source-chip";

export type RecordHistoryListProps =
  | { kind: "oneRM"; series: OneRMSeriesPoint[]; bestRecordedAt: string }
  | { kind: "benchmark"; series: BenchmarkSeriesPoint[]; bestRecordedAt: string };

type HistoryRowModel = {
  recordedAt: string;
  valueLabel: string;
  source: OneRMRecordSourceValue | null;
};

const FIRST_ROW_INDEX = 0;

const toRowModel = (props: RecordHistoryListProps): HistoryRowModel[] => {
  if (props.kind === "oneRM") {
    return props.series.map((point) => ({
      recordedAt: point.recordedAt,
      valueLabel: `${point.valueKg} ${KG_UNIT}`,
      source: point.source,
    }));
  }

  return props.series.map((point) => {
    const { value, unit } = formatResultParts(point.result);

    return {
      recordedAt: point.recordedAt,
      valueLabel: unit.length > 0 ? `${value} ${unit}` : value,
      source: null,
    };
  });
};

export const RecordHistoryList = (props: RecordHistoryListProps): ReactElement => {
  const rows = [...toRowModel(props)].reverse();
  const prLabel = props.kind === "oneRM" ? CURRENT_PR_CHIP_LABEL : PR_CHIP_LABEL;

  return (
    <Stack>
      {rows.map((row, index) => (
        <Stack
          key={`${row.recordedAt}-${index}`}
          direction="row"
          alignItems="center"
          spacing={HISTORY_ROW_GAP}
          sx={(theme) => ({
            py: `${HISTORY_ROW_PADDING_Y_PX}px`,
            borderTop:
              index === FIRST_ROW_INDEX
                ? "none"
                : `1px solid ${alpha(theme.palette.common.white, HISTORY_DIVIDER_ALPHA)}`,
          })}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={HISTORY_VALUE_GAP}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <DisplayNumber value={row.valueLabel} sizePx={HISTORY_VALUE_PX} />
            {row.source !== null ? <SourceChip source={row.source} /> : null}
            {row.recordedAt === props.bestRecordedAt ? <PrChip label={prLabel} /> : null}
          </Stack>
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(CARD_DATE_PX),
              fontWeight: FONT_WEIGHT_MEDIUM,
              color: theme.palette.text.muted,
              whiteSpace: "nowrap",
            })}
          >
            {formatLongDate(row.recordedAt)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};
