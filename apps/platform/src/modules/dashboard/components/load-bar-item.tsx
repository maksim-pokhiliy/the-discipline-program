"use client";

import { LinearProgress, Stack, Typography } from "@mui/material";

import type { LoadDistributionItem } from "@repo/contracts/coach-dashboard";

type LoadBarItemProps = {
  item: LoadDistributionItem;
};

export const LoadBarItem = ({ item }: LoadBarItemProps) => {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {item.categoryName}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {item.athleteCount} {item.athleteCount === 1 ? "athlete" : "athletes"}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={item.percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "action.hover",
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            bgcolor: "primary.main",
          },
        }}
      />
    </Stack>
  );
};
