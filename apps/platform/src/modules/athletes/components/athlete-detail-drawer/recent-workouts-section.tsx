"use client";

import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { Stack, Typography } from "@mui/material";

import type { RecentWorkout } from "@repo/contracts/coach-athletes";
import { formatDate } from "@repo/shared";

type RecentWorkoutsSectionProps = {
  workouts: RecentWorkout[];
};

export const RecentWorkoutsSection: React.FC<RecentWorkoutsSectionProps> = ({ workouts }) => {
  if (workouts.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1} sx={{ p: 2.5 }}>
      <Typography variant="subtitle2">Recent Workouts</Typography>
      {workouts.map((workout) => (
        <Stack key={workout.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <FitnessCenterIcon fontSize="small" sx={{ color: "text.disabled" }} />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {workout.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatDate(workout.date, "weekday")} · {workout.planName}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};
