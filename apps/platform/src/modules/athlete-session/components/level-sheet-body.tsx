"use client";

import { type ReactElement } from "react";

import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { alpha, Button, List, Stack, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";
import { type RowView } from "@repo/contracts/lms/session-detail";

import {
  type LevelApplyOutcome,
  type LevelAxis,
  PICK_COORDINATE_SEPARATOR,
  shortenGraphemes,
  ProfileAxisOutcomeStrip,
  ProfileOptionRow,
} from "@app/lib/level-switch";

import {
  AXIS_AND_SEPARATOR,
  CANCEL_LABEL,
  EYEBROW_LETTER_SPACING,
  FONT_WEIGHT_SEMI_BOLD,
  KG_LABEL,
  SHEET_SUBTITLE_LINE_HEIGHT,
  SHEET_SUBTITLE_PX,
} from "../utils/athlete-session.constants";
import {
  APPLY_COORD_MAX_CHARS,
  APPLY_CTA_PREFIX,
  AXIS_LABEL_PX,
  LEVEL_SHEET_SUBTITLE,
  PICK_CTA_PREFIX,
  PREVIEW_ARROW,
  PREVIEW_ROW_PREFIX,
  PREVIEW_VALUE_SEPARATOR,
  SCOPE_LINE_PREFIX,
  SCOPE_LINE_PX,
  SCOPE_LINE_SUFFIX,
  SCOPE_LINE_WEIGHT_PLURAL,
  SCOPE_LINE_WEIGHT_SINGULAR,
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
} from "../utils/weight-sheet.constants";

const SINGLE_WEIGHT_COUNT = 1;

export type LevelSheetBodyProps = {
  row: RowView;
  axes: LevelAxis[];
  coordinates: Record<string, string>;
  weightCount: number;
  isComplete: boolean;
  isApplying: boolean;
  outcome: LevelApplyOutcome | null;
  onPick: (axisId: string, value: string) => void;
  onApply: () => void;
  onCancel: () => void;
};

const shortenApplyCoordinate = (value: string): string =>
  shortenGraphemes(value, APPLY_COORD_MAX_CHARS);

const byProfileLoadOf = (load: Load | null): Extract<Load, { kind: "byProfile" }> | null =>
  load !== null && load.kind === "byProfile" ? load : null;

const draftKgOf = (
  row: RowView,
  axes: LevelAxis[],
  coordinates: Record<string, string>,
): number | null => {
  const load = byProfileLoadOf(row.load);

  if (load === null) {
    return null;
  }

  const wanted = axes.map((axis) => coordinates[axis.id]);
  const cell = load.cells.find(
    (candidate) =>
      candidate.coords.length === wanted.length &&
      candidate.coords.every((coord, index) => coord === wanted[index]),
  );

  return cell?.kg ?? null;
};

const currentKgOf = (row: RowView): number | null => {
  const { resolvedLoad } = row;

  return resolvedLoad !== null && resolvedLoad.status === "resolved" ? resolvedLoad.kg : null;
};

const buildPreview = (
  row: RowView,
  axes: LevelAxis[],
  coordinates: Record<string, string>,
): string | null => {
  const nextKg = draftKgOf(row, axes, coordinates);

  if (nextKg === null) {
    return null;
  }

  const currentKg = currentKgOf(row);
  const head = `${PREVIEW_ROW_PREFIX}${row.movement}${PREVIEW_VALUE_SEPARATOR}`;
  const next = `${nextKg} ${KG_LABEL}`;

  return currentKg === null || currentKg === nextKg
    ? `${head}${next}`
    : `${head}${currentKg} ${KG_LABEL}${PREVIEW_ARROW}${next}`;
};

const buildScopeLine = (weightCount: number): string => {
  const unit =
    weightCount === SINGLE_WEIGHT_COUNT ? SCOPE_LINE_WEIGHT_SINGULAR : SCOPE_LINE_WEIGHT_PLURAL;

  return `${SCOPE_LINE_PREFIX}${weightCount}${unit}${SCOPE_LINE_SUFFIX}`;
};

const buildCta = (
  axes: LevelAxis[],
  coordinates: Record<string, string>,
  isComplete: boolean,
): string => {
  if (isComplete) {
    const picked = axes
      .map((axis) => coordinates[axis.id])
      .filter((value): value is string => value !== undefined)
      .map(shortenApplyCoordinate);

    return `${APPLY_CTA_PREFIX}${picked.join(PICK_COORDINATE_SEPARATOR)}`;
  }

  const missing = axes
    .filter((axis) => coordinates[axis.id] === undefined)
    .map((axis) => axis.label.toLowerCase());

  return `${PICK_CTA_PREFIX}${missing.join(AXIS_AND_SEPARATOR)}`;
};

export const LevelSheetBody = ({
  row,
  axes,
  coordinates,
  weightCount,
  isComplete,
  isApplying,
  outcome,
  onPick,
  onApply,
  onCancel,
}: LevelSheetBodyProps): ReactElement => {
  const preview = isComplete ? buildPreview(row, axes, coordinates) : null;

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
        {LEVEL_SHEET_SUBTITLE}
      </Typography>

      {axes.map((axis) => (
        <Stack key={axis.id} spacing={SHEET_SECTION_GAP}>
          <Typography
            component="div"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(AXIS_LABEL_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: EYEBROW_LETTER_SPACING,
              textTransform: "uppercase",
              color: theme.palette.text.muted,
            })}
          >
            {axis.label}
          </Typography>

          <List
            role="radiogroup"
            aria-label={axis.label}
            disablePadding
            sx={{ display: "flex", flexDirection: "column", gap: SHEET_SECTION_GAP }}
          >
            {axis.values.map((value) => (
              <ProfileOptionRow
                key={`${axis.id}:${value}`}
                value={value}
                isCurrent={coordinates[axis.id] === value}
                isApplying={isApplying && coordinates[axis.id] === value}
                isLocked={isApplying}
                onPick={() => onPick(axis.id, value)}
              />
            ))}
          </List>
        </Stack>
      ))}

      {preview !== null && (
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
          <VisibilityRounded
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
            {preview}
          </Typography>
        </Stack>
      )}

      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(SCOPE_LINE_PX),
          lineHeight: SHEET_STRIP_LINE_HEIGHT,
          color: theme.palette.text.muted,
        })}
      >
        {buildScopeLine(weightCount)}
      </Typography>

      <ProfileAxisOutcomeStrip outcome={outcome} isLocked={isApplying} onRetry={onApply} />

      <Stack direction="row" spacing={SHEET_ACTIONS_GAP}>
        <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>
          {CANCEL_LABEL}
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          disabled={!isComplete || isApplying}
          onClick={onApply}
        >
          {buildCta(axes, coordinates, isComplete)}
        </Button>
      </Stack>
    </Stack>
  );
};
