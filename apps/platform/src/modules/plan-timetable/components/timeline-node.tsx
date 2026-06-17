import { type ReactElement } from "react";

import { alpha, Box } from "@mui/material";

import {
  NODE_TOP,
  RAIL_ALPHA,
  RAIL_LEFT,
  RAIL_WIDTH_PX,
  TIMELINE_COL_W,
} from "../utils/plan-timetable.constants";
import { type SlotDecoration } from "../utils/timetable-presentation";

export type TimelineNodeProps = {
  decoration: SlotDecoration;
};

export const TimelineNode = ({ decoration }: TimelineNodeProps): ReactElement => (
  <Box sx={{ position: "relative", width: TIMELINE_COL_W, alignSelf: "stretch" }}>
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
      sx={{
        position: "absolute",
        top: NODE_TOP,
        left: "50%",
        transform: "translateX(-50%)",
        width: decoration.node.size,
        height: decoration.node.size,
        borderRadius: "50%",
        bgcolor: decoration.node.bg,
        border: decoration.node.border,
        boxShadow: decoration.node.shadow,
      }}
    />
  </Box>
);
