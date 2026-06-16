import { Box, Stack, Typography } from "@mui/material";

import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";

import { formatRelativeTime } from "../athletes-roster-config";

type TodayPaneProps = {
  detail: CoachAthleteDetail;
};

export const TodayPane: React.FC<TodayPaneProps> = ({ detail }) => (
  <Stack spacing={1.5} sx={{ p: 2 }}>
    <Box>
      <Typography variant="overline" color="text.muted" display="block">
        Last workout
      </Typography>
      <Typography variant="body2">
        {detail.lastActivityDate
          ? formatRelativeTime(detail.lastActivityDate)
          : "No workouts logged yet"}
      </Typography>
    </Box>

    {detail.nextWorkout && (
      <Box>
        <Typography variant="overline" color="text.muted" display="block">
          Next session
        </Typography>
        <Typography variant="body2">{detail.nextWorkout.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {detail.nextWorkout.planName}
        </Typography>
      </Box>
    )}

    <Typography variant="caption" color="text.muted" sx={{ fontStyle: "italic" }}>
      Session-by-session tracking and adherence land in a later pass.
    </Typography>
  </Stack>
);
