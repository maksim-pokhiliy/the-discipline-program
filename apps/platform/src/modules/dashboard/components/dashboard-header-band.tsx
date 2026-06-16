"use client";

import { type ReactElement } from "react";

import { alpha, Box, ButtonBase, Stack, Typography } from "@mui/material";

import { formatDate } from "@repo/shared";

const NAME_FONT_SIZE_PX = 16;
const DATE_FONT_SIZE_PX = 11;
const PILL_HEIGHT_PX = 36;
const PILL_COUNT_FONT_SIZE_PX = 20;
const PILL_LABEL_FONT_SIZE_PX = 12;
const PILL_GAP_PX = 8;
const PILL_PADDING_X_PX = 12;
const ATTENTION_TINT_ALPHA = 0.12;
const ATTENTION_HOVER_TINT_ALPHA = 0.2;
const ALL_CLEAR_TINT_ALPHA = 0.18;
const ALL_CLEAR_HOVER_TINT_ALPHA = 0.26;

const ALL_CLEAR_LABEL = "All clear";
const NEED_ATTENTION_LABEL = "Need attention";

export type DashboardHeaderBandProps = {
  coachName: string | null;
  needAttentionCount: number;
  onScrollToAttention: () => void;
};

export const DashboardHeaderBand = ({
  coachName,
  needAttentionCount,
  onScrollToAttention,
}: DashboardHeaderBandProps): ReactElement => {
  const isAllClear = needAttentionCount === 0;
  const toneColor = isAllClear ? "success" : "primary";
  const baseTintAlpha = isAllClear ? ALL_CLEAR_TINT_ALPHA : ATTENTION_TINT_ALPHA;
  const hoverTintAlpha = isAllClear ? ALL_CLEAR_HOVER_TINT_ALPHA : ATTENTION_HOVER_TINT_ALPHA;

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={(theme) => ({
            fontFamily: "var(--font-display)",
            fontWeight: theme.typography.fontWeightBold,
            fontSize: theme.typography.pxToRem(NAME_FONT_SIZE_PX),
            lineHeight: 1.05,
            letterSpacing: "-0.005em",
            textTransform: "uppercase",
            color: theme.palette.text.primary,
          })}
        >
          {coachName === null ? "Coach" : `Coach ${coachName}`}
        </Typography>

        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(DATE_FONT_SIZE_PX),
            fontWeight: theme.typography.fontWeightMedium,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
          })}
        >
          {formatDate(new Date(), "weekday")}
        </Typography>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <ButtonBase
        onClick={onScrollToAttention}
        sx={(theme) => ({
          display: "inline-flex",
          alignItems: "center",
          gap: `${PILL_GAP_PX}px`,
          height: PILL_HEIGHT_PX,
          px: `${PILL_PADDING_X_PX}px`,
          borderRadius: theme.spacing(0.5),
          bgcolor: alpha(theme.palette[toneColor].main, baseTintAlpha),
          color: theme.palette[toneColor].main,
          fontSize: theme.typography.pxToRem(PILL_LABEL_FONT_SIZE_PX),
          fontWeight: theme.typography.fontWeightBold,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          transition: theme.transitions.create("background-color"),
          "&:hover": {
            bgcolor: alpha(theme.palette[toneColor].main, hoverTintAlpha),
          },
        })}
      >
        <Box
          component="span"
          sx={(theme) => ({
            fontFamily: "var(--font-display)",
            fontSize: theme.typography.pxToRem(PILL_COUNT_FONT_SIZE_PX),
            fontWeight: theme.typography.fontWeightBold,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          })}
        >
          {needAttentionCount}
        </Box>
        <Box component="span">{isAllClear ? ALL_CLEAR_LABEL : NEED_ATTENTION_LABEL}</Box>
      </ButtonBase>
    </Stack>
  );
};
