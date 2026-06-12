"use client";

import { type ReactElement } from "react";

import { Box, Tooltip } from "@mui/material";

const TRACK_BADGE_PX = 22;
const TRACK_BADGE_FONT_SIZE_PX = 12;
const TRACK_BADGE_FONT_WEIGHT = 700;
const TRACK_NUMBER_OFFSET = 1;
const TRACK_TOOLTIP_PREFIX = "Track";

type GroupTrackBadgeProps = {
  index: number;
};

export const GroupTrackBadge: React.FC<GroupTrackBadgeProps> = ({ index }): ReactElement => {
  const trackNumber = index + TRACK_NUMBER_OFFSET;

  return (
    <Tooltip title={`${TRACK_TOOLTIP_PREFIX} ${trackNumber}`}>
      <Box
        sx={(theme) => ({
          width: TRACK_BADGE_PX,
          height: TRACK_BADGE_PX,
          borderRadius: "50%",
          border: `1px solid ${theme.palette.primary.main}`,
          color: "primary.main",
          fontFamily: theme.typography.h4.fontFamily,
          fontWeight: TRACK_BADGE_FONT_WEIGHT,
          fontSize: TRACK_BADGE_FONT_SIZE_PX,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        })}
      >
        {trackNumber}
      </Box>
    </Tooltip>
  );
};
