import { type ReactElement } from "react";

import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { alpha, Box, ButtonBase, Stack } from "@mui/material";

import {
  DATE_COL_W,
  FONT_WEIGHT_SEMI_BOLD,
  HINT_ICON_PX,
  HINT_TEXT_PX,
  NEXT_HINT_NODE_SIZE,
  NEXT_HINT_RAIL_HEIGHT,
  NODE_HOLLOW_ALPHA,
  RAIL_ALPHA,
  RAIL_LEFT,
  RAIL_WIDTH_PX,
  TIMELINE_COL_W,
} from "../utils/plan-timetable.constants";

export type NextWeekHintProps = {
  label: string;
  onNext: () => void;
};

export const NextWeekHint = ({ label, onNext }: NextWeekHintProps): ReactElement => (
  <Stack direction="row" alignItems="flex-start">
    <Box sx={{ width: DATE_COL_W, flexShrink: 0 }} />

    <Box sx={{ position: "relative", width: TIMELINE_COL_W, height: NEXT_HINT_RAIL_HEIGHT }}>
      <Box
        sx={(theme) => ({
          position: "absolute",
          top: 0,
          bottom: 0,
          left: RAIL_LEFT,
          width: RAIL_WIDTH_PX,
          bgcolor: alpha(theme.palette.common.white, RAIL_ALPHA),
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: NEXT_HINT_NODE_SIZE,
          height: NEXT_HINT_NODE_SIZE,
          borderRadius: "50%",
          bgcolor: theme.palette.background.default,
          border: `2px solid ${alpha(theme.palette.common.white, NODE_HOLLOW_ALPHA)}`,
        })}
      />
    </Box>

    <ButtonBase
      onClick={onNext}
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        color: theme.palette.text.subtle,
        fontSize: theme.typography.pxToRem(HINT_TEXT_PX),
        fontWeight: FONT_WEIGHT_SEMI_BOLD,
        transition: theme.transitions.create("color"),
        "&:hover": { color: theme.palette.primary.main },
      })}
    >
      {label}
      <ArrowForwardRounded sx={{ fontSize: HINT_ICON_PX }} />
    </ButtonBase>
  </Stack>
);
