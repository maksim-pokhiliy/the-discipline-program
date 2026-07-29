import { type ReactElement } from "react";

import UnfoldMoreRounded from "@mui/icons-material/UnfoldMoreRounded";
import { alpha, Box, ButtonBase, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import {
  FONT_WEIGHT_SEMI_BOLD,
  ROW_AT_ALPHA,
  ROW_LOAD_ALPHA,
  ROW_LOAD_PX,
} from "../utils/athlete-session.constants";
import { buildLoadCell, type LoadChipTarget } from "../utils/load-cell";
import { buildPulseKeyframes } from "../utils/pulse-animation";
import {
  CHIP_ACTION_LABEL,
  CHIP_CHEVRON_ALPHA,
  CHIP_CHEVRON_PX,
  CHIP_GAP_PX,
  CHIP_LABEL_SEPARATOR,
  CHIP_MARGIN_LEFT_PX,
  CHIP_NARROW_BREAKPOINT_PX,
  CHIP_PADDING_X_PX,
  CHIP_PADDING_Y_PX,
  CHIP_SOURCE_MAX_WIDTH_PX,
  CHIP_SOURCE_PX,
  CHIP_SOURCE_SEPARATOR,
  DOTTED_UNDERLINE_ALPHA,
  PULSE_DURATION_MS,
} from "../utils/weight-sheet.constants";

const NO_MOTION_QUERY = "@media (prefers-reduced-motion: no-preference)";

export type LoadCellProps = {
  row: RowView;
  isPulsing: boolean;
  onOpen: (target: LoadChipTarget) => void;
};

export const LoadCell = ({ row, isPulsing, onOpen }: LoadCellProps): ReactElement | null => {
  const cell = buildLoadCell(row);

  switch (cell.kind) {
    case "empty":
      return null;
    case "bare":
      return (
        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(ROW_LOAD_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            color: alpha(theme.palette.common.white, ROW_LOAD_ALPHA),
            overflowWrap: "anywhere",
          })}
        >
          {cell.value}
        </Typography>
      );
    case "chip":
      return (
        <ButtonBase
          aria-label={
            cell.isPrompt
              ? `${cell.value}${CHIP_LABEL_SEPARATOR}${cell.source}`
              : `${cell.value}${CHIP_LABEL_SEPARATOR}${cell.source}${CHIP_LABEL_SEPARATOR}${CHIP_ACTION_LABEL}`
          }
          onClick={() => onOpen(cell.target)}
          sx={(theme) => ({
            display: "inline-flex",
            alignItems: "baseline",
            gap: `${CHIP_GAP_PX}px`,
            minWidth: 0,
            overflowWrap: "anywhere",
            px: `${CHIP_PADDING_X_PX}px`,
            py: `${CHIP_PADDING_Y_PX}px`,
            mx: `${-CHIP_PADDING_X_PX}px`,
            my: `${-CHIP_PADDING_Y_PX}px`,
            ml: `${-CHIP_MARGIN_LEFT_PX}px`,
            borderRadius: 1,
            "&:hover": { backgroundColor: theme.palette.action.hover },
            "&:active": { backgroundColor: theme.palette.action.selected },
            ...(isPulsing && {
              [NO_MOTION_QUERY]: {
                animation: `${buildPulseKeyframes(theme)} ${PULSE_DURATION_MS}ms ease-out`,
              },
            }),
          })}
        >
          <Box
            component="span"
            sx={(theme) => ({
              minWidth: 0,
              fontSize: theme.typography.pxToRem(ROW_LOAD_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              color: cell.isPrompt
                ? theme.palette.text.secondary
                : alpha(theme.palette.common.white, ROW_LOAD_ALPHA),
              overflowWrap: cell.isPrompt ? "anywhere" : undefined,
              whiteSpace: cell.isPrompt ? undefined : "nowrap",
            })}
          >
            {cell.value}
          </Box>

          <Box
            component="span"
            aria-hidden
            sx={(theme) => ({ color: alpha(theme.palette.common.white, ROW_AT_ALPHA) })}
          >
            {CHIP_SOURCE_SEPARATOR}
          </Box>

          <Box
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(CHIP_SOURCE_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              color: cell.isPrompt ? theme.palette.primary.main : theme.palette.text.muted,
              borderBottom: "1px dotted",
              borderColor: alpha(theme.palette.primary.main, DOTTED_UNDERLINE_ALPHA),
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: `${CHIP_SOURCE_MAX_WIDTH_PX.narrow}px`,
              [theme.breakpoints.up(CHIP_NARROW_BREAKPOINT_PX)]: {
                maxWidth: `${CHIP_SOURCE_MAX_WIDTH_PX.phone}px`,
              },
              [theme.breakpoints.up("md")]: {
                maxWidth: `${CHIP_SOURCE_MAX_WIDTH_PX.desktop}px`,
              },
            })}
          >
            {cell.source}
          </Box>

          <UnfoldMoreRounded
            aria-hidden
            sx={(theme) => ({
              alignSelf: "center",
              display: "none",
              fontSize: CHIP_CHEVRON_PX,
              color: alpha(theme.palette.primary.main, CHIP_CHEVRON_ALPHA),
              [theme.breakpoints.up(CHIP_NARROW_BREAKPOINT_PX)]: { display: "block" },
            })}
          />
        </ButtonBase>
      );
    default:
      cell satisfies never;

      return null;
  }
};
