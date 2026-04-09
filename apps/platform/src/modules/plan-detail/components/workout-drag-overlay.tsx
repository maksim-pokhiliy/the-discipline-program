import { Paper, Typography } from "@mui/material";

import type { Workout } from "@repo/contracts/workout";

export const WorkoutDragOverlay: React.FC<{ workout: Workout }> = ({ workout }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      borderColor: "primary.main",
      borderWidth: 2,
    }}
  >
    <Typography variant="body2">{workout.title || "Untitled workout"}</Typography>
  </Paper>
);
