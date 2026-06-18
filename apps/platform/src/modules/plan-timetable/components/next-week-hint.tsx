import { type ReactElement } from "react";

import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { alpha, ButtonBase, useTheme } from "@mui/material";

import {
  DATE_COL_W,
  DATE_LINE_GAP,
  FONT_WEIGHT_SEMI_BOLD,
  HINT_ICON_PX,
  HINT_TEXT_PX,
  NEXT_HINT_NODE_SIZE,
  NEXT_HINT_RAIL_HEIGHT,
  NODE_HOLLOW_ALPHA,
  RAIL_ALPHA,
  RAIL_WIDTH_PX,
  TIMELINE_COL_W,
  TIMELINE_CONTENT_PX,
  TIMELINE_HINT_CONTENT_PT,
} from "../utils/plan-timetable.constants";

export type NextWeekHintProps = {
  label: string;
  onNext: () => void;
};

export const NextWeekHint = ({ label, onNext }: NextWeekHintProps): ReactElement => {
  const theme = useTheme();

  return (
    <TimelineItem sx={{ minHeight: 0, "&::before": { display: "none" } }}>
      <TimelineOppositeContent
        sx={{ flex: "0 0 auto", width: DATE_COL_W, mr: DATE_LINE_GAP, p: 0 }}
      />

      <TimelineSeparator sx={{ flex: "0 0 auto", width: TIMELINE_COL_W }}>
        <TimelineConnector
          sx={{
            flex: "0 0 auto",
            width: RAIL_WIDTH_PX,
            minHeight: NEXT_HINT_RAIL_HEIGHT,
            bgcolor: alpha(theme.palette.common.white, RAIL_ALPHA),
          }}
        />
        <TimelineDot
          sx={{
            m: 0,
            alignSelf: "center",
            p: 0,
            boxSizing: "border-box",
            width: NEXT_HINT_NODE_SIZE,
            height: NEXT_HINT_NODE_SIZE,
            bgcolor: theme.palette.background.default,
            border: `2px solid ${alpha(theme.palette.common.white, NODE_HOLLOW_ALPHA)}`,
            boxShadow: "none",
          }}
        />
      </TimelineSeparator>

      <TimelineContent
        sx={{ minWidth: 0, m: 0, py: 0, pt: TIMELINE_HINT_CONTENT_PT, px: TIMELINE_CONTENT_PX }}
      >
        <ButtonBase
          onClick={onNext}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            color: theme.palette.text.subtle,
            fontSize: theme.typography.pxToRem(HINT_TEXT_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            transition: theme.transitions.create("color"),
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          {label}
          <ArrowForwardRounded sx={{ fontSize: HINT_ICON_PX }} />
        </ButtonBase>
      </TimelineContent>
    </TimelineItem>
  );
};
