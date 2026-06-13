"use client";

import { type ReactElement } from "react";

import { Box, Stack, alpha } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { GroupTrackBadge } from "./group-track-badge";
import { SchemaCard } from "./schema-card";

const TRACK_GAP_PX = 8;
const TRACK_PADDING_LEFT_PX = 14;
const RAIL_LEFT_PX = 4;
const RAIL_WIDTH_PX = 2;
const RAIL_BORDER_RADIUS = 1;
const RAIL_ALPHA = 0.45;
const TRACK_ROW_SPACING = 1;

type GroupTrackWrapperProps = {
  member: SchemaWithBody;
  index: number;
  isContinuation: boolean;
  planId: string;
  startDate: string;
  parentIsReorderPending: boolean;
};

export const GroupTrackWrapper: React.FC<GroupTrackWrapperProps> = ({
  member,
  index,
  isContinuation,
  planId,
  startDate,
  parentIsReorderPending,
}): ReactElement => (
  <Box
    sx={(theme) => ({
      position: "relative",
      pl: `${TRACK_PADDING_LEFT_PX}px`,
      "&::before": {
        content: '""',
        position: "absolute",
        left: RAIL_LEFT_PX,
        top: isContinuation ? -TRACK_GAP_PX : 0,
        bottom: 0,
        width: RAIL_WIDTH_PX,
        bgcolor: alpha(theme.palette.primary.main, RAIL_ALPHA),
        borderRadius: RAIL_BORDER_RADIUS,
      },
    })}
  >
    <Stack direction="row" alignItems="flex-start" spacing={TRACK_ROW_SPACING}>
      <GroupTrackBadge index={index} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <SchemaCard
          schema={member}
          planId={planId}
          startDate={startDate}
          parentIsReorderPending={parentIsReorderPending}
          isBoxed
          isDraggable={false}
        />
      </Box>
    </Stack>
  </Box>
);
