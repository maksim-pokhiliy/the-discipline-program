"use client";

import {
  AddRounded,
  ContentCopyRounded,
  FitnessCenterRounded,
  GroupRounded,
} from "@mui/icons-material";
import { Grid, Stack, Typography } from "@mui/material";

import { QuickActionButton } from "../components";

export const QuickActionsSection = () => {
  return (
    <Stack spacing={1.5}>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={1.5}>
        <Grid size={6}>
          <QuickActionButton icon={<AddRounded />} label="New Plan" href="/coach/plans/create" />
        </Grid>
        <Grid size={6}>
          <QuickActionButton
            icon={<FitnessCenterRounded />}
            label="Add Exercise"
            href="/coach/exercises/create"
          />
        </Grid>
        <Grid size={6}>
          <QuickActionButton icon={<GroupRounded />} label="View Athletes" href="/coach/athletes" />
        </Grid>
        <Grid size={6}>
          <QuickActionButton
            icon={<ContentCopyRounded />}
            label="Copy Plan"
            href="/coach/plans?action=duplicate"
          />
        </Grid>
      </Grid>
    </Stack>
  );
};
