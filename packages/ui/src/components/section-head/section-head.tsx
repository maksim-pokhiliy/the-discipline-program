import { type ReactElement, type ReactNode } from "react";

import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { type PaletteColorKey } from "@repo/mui";

const HEAD_GAP_PX = 10;
const HEAD_PADDING_X_PX = 2;
const COUNT_HEIGHT_PX = 20;
const COUNT_PADDING_X_PX = 6;
const COUNT_RADIUS_PX = 999;
const COUNT_FONT_SIZE_PX = 11;
const COUNT_TONE_BG_ALPHA = 0.2;
const COUNT_DEFAULT_BG_ALPHA = 0.1;
const META_FONT_SIZE_PX = 11;
const META_LETTER_SPACING_EM = "0.04em";
const META_FONT_WEIGHT = 600;

export type SectionHeadCountTone = "default" | "warn" | "error" | "success";

export type SectionHeadProps = {
  title: string;
  count?: number;
  countTone?: SectionHeadCountTone;
  meta?: string;
  action?: ReactNode;
};

const COUNT_TONE_TO_PALETTE: Record<Exclude<SectionHeadCountTone, "default">, PaletteColorKey> = {
  warn: "warning",
  error: "error",
  success: "success",
};

export const SectionHead: React.FC<SectionHeadProps> = ({
  title,
  count,
  countTone = "default",
  meta,
  action,
}): ReactElement => (
  <Stack
    direction="row"
    alignItems="center"
    sx={{
      gap: `${HEAD_GAP_PX}px`,
      px: `${HEAD_PADDING_X_PX}px`,
    }}
  >
    <Typography variant="h4" component="span" sx={{ color: "text.primary" }}>
      {title}
    </Typography>

    {count !== undefined && (
      <Box
        component="span"
        sx={(theme) => ({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: `${COUNT_HEIGHT_PX}px`,
          minWidth: `${COUNT_HEIGHT_PX}px`,
          px: `${COUNT_PADDING_X_PX}px`,
          borderRadius: `${COUNT_RADIUS_PX}px`,
          fontFamily: theme.typography.fontFamily,
          fontSize: `${COUNT_FONT_SIZE_PX}px`,
          fontWeight: theme.typography.fontWeightBold,
          fontVariantNumeric: "tabular-nums",
          backgroundColor:
            countTone === "default"
              ? alpha(theme.palette.common.white, COUNT_DEFAULT_BG_ALPHA)
              : alpha(theme.palette[COUNT_TONE_TO_PALETTE[countTone]].main, COUNT_TONE_BG_ALPHA),
          color:
            countTone === "default"
              ? theme.palette.text.primary
              : theme.palette[COUNT_TONE_TO_PALETTE[countTone]].main,
        })}
      >
        {count}
      </Box>
    )}

    {meta !== undefined && (
      <Typography
        component="span"
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamily,
          fontSize: `${META_FONT_SIZE_PX}px`,
          fontWeight: META_FONT_WEIGHT,
          letterSpacing: META_LETTER_SPACING_EM,
          textTransform: "uppercase",
          color: theme.palette.text.secondary,
        })}
      >
        {meta}
      </Typography>
    )}

    <Box sx={{ flex: 1 }} />

    {action}
  </Stack>
);
