"use client";

import { Typography } from "@mui/material";

export const DayRowEmpty: React.FC = () => (
  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic", py: 0.5 }}>
    — no sessions yet —
  </Typography>
);
