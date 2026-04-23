import { Paper, Stack, Typography } from "@mui/material";

import type { Workout } from "@repo/contracts/lms/workout";

const getBlockSummary = (workout: Workout): string => {
  const blocks = workout.contentDoc?.content ?? [];

  if (blocks.length === 0) {
    return "Empty";
  }

  return blocks.length === 1 ? "1 block" : `${blocks.length} blocks`;
};

export const WorkoutDragOverlay: React.FC<{ workout: Workout }> = ({ workout }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      borderColor: "primary.main",
      borderWidth: 2,
    }}
  >
    <Stack spacing={0.5}>
      <Typography variant="body2">{workout.title || "Untitled workout"}</Typography>
      <Typography variant="caption" color="text.secondary">
        {getBlockSummary(workout)}
      </Typography>
    </Stack>
  </Paper>
);
