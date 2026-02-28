"use client";

import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Grid } from "@mui/material";

import type { DashboardOverview } from "@repo/contracts/coach-dashboard";
import { StatsCard } from "@repo/ui";

type OverviewSectionProps = {
  overview: DashboardOverview;
};

export const OverviewSection: React.FC<OverviewSectionProps> = ({ overview }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 3 }}>
        <StatsCard
          title="Active Athletes"
          tooltip="Athletes with active enrollment"
          value={overview.totalActiveAthletes}
          icon={<GroupIcon fontSize="large" />}
          color="success"
        />
      </Grid>

      <Grid size={{ xs: 6, md: 3 }}>
        <StatsCard
          title="Workouts Today"
          tooltip="Completed / planned workouts for today"
          value={`${overview.workoutsCompletedToday} / ${overview.workoutsPlannedToday}`}
          icon={<FitnessCenterIcon fontSize="large" />}
          color="primary"
        />
      </Grid>

      <Grid size={{ xs: 6, md: 3 }}>
        <StatsCard
          title="Need Attention"
          tooltip="Open action items requiring your review"
          value={overview.openActionItemsCount}
          icon={<WarningAmberIcon fontSize="large" />}
          color={overview.openActionItemsCount > 0 ? "warning" : "success"}
        />
      </Grid>

      <Grid size={{ xs: 6, md: 3 }}>
        <StatsCard
          title="Trained This Week"
          tooltip="Unique athletes who logged at least 1 workout in the last 7 days"
          value={`${overview.trainedThisWeekCount} / ${overview.totalActiveAthletes}`}
          icon={<DirectionsRunIcon fontSize="large" />}
          color={overview.trainedThisWeekCount > 0 ? "primary" : "warning"}
        />
      </Grid>
    </Grid>
  );
};
