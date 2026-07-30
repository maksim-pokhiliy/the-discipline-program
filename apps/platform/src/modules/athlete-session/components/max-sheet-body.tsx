"use client";

import { type ReactElement } from "react";

import HistoryRounded from "@mui/icons-material/HistoryRounded";
import { alpha, Button, Chip, Stack, TextField, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";
import { ONE_RM_RECORD_SOURCE_LABELS } from "@repo/contracts/lms/one-rm-record";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import { formatLocalLongDate } from "@app/lib/format-record-date";

import {
  CANCEL_LABEL,
  FONT_WEIGHT_SEMI_BOLD,
  KG_LABEL,
  SHEET_SUBTITLE_LINE_HEIGHT,
  SHEET_SUBTITLE_PX,
} from "../utils/athlete-session.constants";
import { parseOneRm } from "../utils/weight-sheet-model";
import {
  LATEST_RECORD_PREFIX,
  LATEST_RECORD_SEPARATOR,
  MAX_HELPER_NO_RECORD_PREFIX,
  MAX_HELPER_NO_RECORD_SUFFIX,
  MAX_HELPER_WITH_RECORD,
  MAX_INPUT_LABEL,
  MAX_INPUT_MODE,
  MAX_INPUT_PLACEHOLDER,
  MAX_SAVE_CTA_INVALID,
  MAX_SAVE_CTA_PREFIX,
  MAX_SAVE_CTA_SUFFIX,
  MAX_SHEET_SUBTITLE_PREFIX,
  MAX_SHEET_SUBTITLE_SUFFIX,
  PERCENT_SUFFIX,
  RANGE_SEPARATOR,
  SHEET_ACTIONS_GAP,
  SHEET_BODY_GAP,
  SHEET_SECTION_GAP,
  SHEET_STRIP_BG_ALPHA,
  SHEET_STRIP_ICON_PX,
  SHEET_STRIP_LINE_HEIGHT,
  SHEET_STRIP_PADDING_X,
  SHEET_STRIP_PADDING_Y,
  SHEET_STRIP_PX,
  SHEET_STRIP_RADIUS_PX,
  SOURCE_CHIP_COLOR,
} from "../utils/weight-sheet.constants";

type ResolvedArm = Extract<ResolvedLoad, { status: "resolved" }>;
type OneRmSource = Extract<NonNullable<ResolvedArm["source"]>, { kind: "one_rm" }>;

export type MaxSheetBodyProps = {
  row: RowView;
  value: string;
  isSaving: boolean;
  canSave: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

const oneRmSourceOf = (row: RowView): OneRmSource | null => {
  const { resolvedLoad } = row;

  if (resolvedLoad === null || resolvedLoad.status !== "resolved") {
    return null;
  }

  const { source } = resolvedLoad;

  return source !== undefined && source.kind === "one_rm" ? source : null;
};

const percentSpan = (value: number, max: number | undefined): string =>
  max === undefined ? `${value}` : `${value}${RANGE_SEPARATOR}${max}`;

const authoredPercentOf = (load: Load | null): string =>
  load !== null && load.kind === "percentage"
    ? `${percentSpan(load.value, load.rangeMax)}${PERCENT_SUFFIX}`
    : PERCENT_SUFFIX;

const buildSubtitle = (row: RowView, source: OneRmSource | null): string => {
  const percent =
    source === null
      ? authoredPercentOf(row.load)
      : `${percentSpan(source.percent, source.percentMax)}${PERCENT_SUFFIX}`;

  return `${MAX_SHEET_SUBTITLE_PREFIX}${percent}${MAX_SHEET_SUBTITLE_SUFFIX}`;
};

const buildLatestRecord = (source: OneRmSource): string =>
  `${LATEST_RECORD_PREFIX}${source.baseKg} ${KG_LABEL}${LATEST_RECORD_SEPARATOR}${formatLocalLongDate(source.recordedAt)}`;

const buildHelper = (row: RowView, source: OneRmSource | null): string =>
  source !== null
    ? MAX_HELPER_WITH_RECORD
    : `${MAX_HELPER_NO_RECORD_PREFIX}${row.movement}${MAX_HELPER_NO_RECORD_SUFFIX}`;

const buildSaveCta = (value: string): string => {
  const parsed = parseOneRm(value);

  return parsed === null
    ? MAX_SAVE_CTA_INVALID
    : `${MAX_SAVE_CTA_PREFIX}${parsed}${MAX_SAVE_CTA_SUFFIX}`;
};

export const MaxSheetBody = ({
  row,
  value,
  isSaving,
  canSave,
  onChange,
  onSave,
  onCancel,
}: MaxSheetBodyProps): ReactElement => {
  const source = oneRmSourceOf(row);

  return (
    <Stack spacing={SHEET_BODY_GAP}>
      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(SHEET_SUBTITLE_PX),
          lineHeight: SHEET_SUBTITLE_LINE_HEIGHT,
          color: theme.palette.text.secondary,
        })}
      >
        {buildSubtitle(row, source)}
      </Typography>

      {source !== null && (
        <Stack
          direction="row"
          spacing={SHEET_SECTION_GAP}
          useFlexGap
          sx={(theme) => ({
            alignItems: "center",
            flexWrap: "wrap",
            py: SHEET_STRIP_PADDING_Y,
            px: SHEET_STRIP_PADDING_X,
            borderRadius: `${SHEET_STRIP_RADIUS_PX}px`,
            bgcolor: alpha(theme.palette.primary.main, SHEET_STRIP_BG_ALPHA),
          })}
        >
          <HistoryRounded
            aria-hidden
            sx={(theme) => ({
              fontSize: SHEET_STRIP_ICON_PX,
              color: theme.palette.primary.main,
            })}
          />
          <Typography
            component="div"
            sx={(theme) => ({
              minWidth: 0,
              fontSize: theme.typography.pxToRem(SHEET_STRIP_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              lineHeight: SHEET_STRIP_LINE_HEIGHT,
              overflowWrap: "anywhere",
              color: theme.palette.text.primary,
            })}
          >
            {buildLatestRecord(source)}
          </Typography>
          <Chip
            size="small"
            color={SOURCE_CHIP_COLOR[source.recordSource]}
            label={ONE_RM_RECORD_SOURCE_LABELS[source.recordSource]}
          />
        </Stack>
      )}

      <TextField
        fullWidth
        label={MAX_INPUT_LABEL}
        placeholder={MAX_INPUT_PLACEHOLDER}
        value={value}
        disabled={isSaving}
        helperText={buildHelper(row, source)}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{ htmlInput: { inputMode: MAX_INPUT_MODE } }}
      />

      <Stack direction="row" spacing={SHEET_ACTIONS_GAP}>
        <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>
          {CANCEL_LABEL}
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          disabled={!canSave || isSaving}
          onClick={onSave}
        >
          {buildSaveCta(value)}
        </Button>
      </Stack>
    </Stack>
  );
};
