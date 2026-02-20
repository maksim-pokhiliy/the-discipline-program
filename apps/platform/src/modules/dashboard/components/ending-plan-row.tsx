"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { EndingPlan } from "@repo/contracts/coach-dashboard";

type EndingPlanRowProps = {
  plan: EndingPlan;
};

export const EndingPlanRow = ({ plan }: EndingPlanRowProps) => {
  const chipColor: "error" | "warning" = plan.daysLeft < 7 ? "error" : "warning";
  const chipLabel = plan.daysLeft <= 0 ? "Ended" : `${plan.daysLeft}d left`;

  return (
    <Box
      component={Link}
      href={`/coach/athletes/${plan.athleteId}`}
      sx={{
        textDecoration: "none",
        color: "inherit",
        "&:active": { opacity: 0.7 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {plan.athleteName ?? "Unknown"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {plan.planName}
          </Typography>
        </Stack>
        <Chip
          label={chipLabel}
          color={chipColor}
          size="small"
          sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
        />
      </Stack>
    </Box>
  );
};
