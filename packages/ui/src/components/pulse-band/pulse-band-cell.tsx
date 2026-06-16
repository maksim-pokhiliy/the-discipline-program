import { type ReactElement } from "react";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { type PaletteColorKey } from "@repo/mui";

const CELL_PADDING_Y_PX = 14;
const CELL_PADDING_RIGHT_PX = 14;
const CELL_PADDING_LEFT_PX = 16;
const CELL_GAP_PX = 4;
const NUM_FONT_SIZE_PX = 34;
const NUM_LETTER_SPACING_EM = "-0.015em";
const SUFFIX_FONT_SIZE_PX = 18;
const BAR_HEIGHT_PX = 2;
const BAR_TRACK_ALPHA = 0.06;
const NEUTRAL_FILL_ALPHA = 0.16;
const FULL_PERCENT = 100;

export type PulseBandCellTone = PaletteColorKey | "neutral";

export type PulseBandCellProps = {
  value: string | number;
  suffix?: string;
  label: string;
  tone: PulseBandCellTone;
  barPct: number;
};

export const PulseBandCell: React.FC<PulseBandCellProps> = ({
  value,
  suffix,
  label,
  tone,
  barPct,
}): ReactElement => {
  const clampedPct = Math.max(0, Math.min(FULL_PERCENT, barPct));

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: `${CELL_GAP_PX}px`,
        minWidth: 0,
        padding: `${CELL_PADDING_Y_PX}px ${CELL_PADDING_RIGHT_PX}px ${CELL_PADDING_Y_PX}px ${CELL_PADDING_LEFT_PX}px`,
        borderLeft: `1px solid ${theme.palette.divider}`,
        "&:first-of-type": {
          borderLeft: "none",
        },
      })}
    >
      <Typography
        variant="h2"
        component="div"
        sx={(theme) => ({
          fontSize: `${NUM_FONT_SIZE_PX}px`,
          lineHeight: 1,
          letterSpacing: NUM_LETTER_SPACING_EM,
          color: tone === "neutral" ? theme.palette.text.primary : theme.palette[tone].main,
        })}
      >
        {value}
        {suffix !== undefined && (
          <Box
            component="span"
            sx={(theme) => ({
              fontFamily: theme.typography.h2.fontFamily,
              fontWeight: theme.typography.h2.fontWeight,
              fontSize: `${SUFFIX_FONT_SIZE_PX}px`,
              letterSpacing: NUM_LETTER_SPACING_EM,
              color: theme.palette.text.secondary,
            })}
          >
            {suffix}
          </Box>
        )}
      </Typography>

      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>

      <Box
        sx={(theme) => ({
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: `${BAR_HEIGHT_PX}px`,
          backgroundColor: alpha(theme.palette.common.white, BAR_TRACK_ALPHA),
        })}
      >
        <Box
          sx={(theme) => ({
            height: "100%",
            width: `${clampedPct}%`,
            backgroundColor:
              tone === "neutral"
                ? alpha(theme.palette.common.white, NEUTRAL_FILL_ALPHA)
                : theme.palette[tone].main,
          })}
        />
      </Box>
    </Box>
  );
};
