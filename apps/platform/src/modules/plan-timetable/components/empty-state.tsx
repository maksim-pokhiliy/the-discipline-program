import { type ReactElement } from "react";

import EventBusyRounded from "@mui/icons-material/EventBusyRounded";
import { Box, Stack, Typography } from "@mui/material";

import {
  EMPTY_BODY_LABEL,
  EMPTY_BODY_LINE_HEIGHT,
  EMPTY_BODY_MAX_W,
  EMPTY_BODY_PX,
  EMPTY_CIRCLE_PX,
  EMPTY_ICON_PX,
  EMPTY_TITLE_LABEL,
  EMPTY_TITLE_PX,
  FONT_WEIGHT_MEDIUM,
} from "../utils/plan-timetable.constants";

export const PlanTimetableEmptyState = (): ReactElement => (
  <Stack
    alignItems="center"
    justifyContent="center"
    spacing={2}
    sx={{ px: { xs: 4.5, md: 6 }, py: { xs: 9, md: 12 }, minHeight: "100%" }}
  >
    <Box
      sx={(theme) => ({
        width: EMPTY_CIRCLE_PX,
        height: EMPTY_CIRCLE_PX,
        borderRadius: "50%",
        border: `2px dashed ${theme.palette.dividerStrong}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <EventBusyRounded sx={{ fontSize: EMPTY_ICON_PX, color: "text.disabled" }} />
    </Box>

    <Typography
      component="span"
      sx={(theme) => ({
        fontSize: {
          xs: theme.typography.pxToRem(EMPTY_TITLE_PX.xs),
          md: theme.typography.pxToRem(EMPTY_TITLE_PX.md),
        },
        fontWeight: FONT_WEIGHT_MEDIUM,
        color: theme.palette.text.primary,
      })}
    >
      {EMPTY_TITLE_LABEL}
    </Typography>

    <Typography
      sx={(theme) => ({
        textAlign: "center",
        maxWidth: EMPTY_BODY_MAX_W,
        fontSize: theme.typography.pxToRem(EMPTY_BODY_PX),
        lineHeight: EMPTY_BODY_LINE_HEIGHT,
        color: theme.palette.text.secondary,
      })}
    >
      {EMPTY_BODY_LABEL}
    </Typography>
  </Stack>
);
