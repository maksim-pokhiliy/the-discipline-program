"use client";

import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Grid } from "@mui/material";

import type { DashboardOverview } from "@repo/contracts/coach-dashboard";
import { StatsCard } from "@repo/ui";

type OverviewSectionProps = {
  overview: DashboardOverview;
};

export const OverviewSection: React.FC<OverviewSectionProps> = ({ overview }) => {
  return (
    <Grid container spacing={{ xs: 1.5, md: 3 }}>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <StatsCard
          size="small"
          title="Active Athletes"
          tooltip="Total athletes with active enrollment"
          value={overview.totalActiveAthletes}
          icon={<GroupIcon />}
          color="success"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <StatsCard
          size="small"
          title="Training Plans"
          tooltip="Training plans with active status"
          value={overview.activePlansCount}
          icon={<ListAltIcon />}
          color="primary"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <StatsCard
          size="small"
          title="Workouts Today"
          tooltip="Completed / planned workouts for today"
          value={`${overview.workoutsCompletedToday} / ${overview.workoutsPlannedToday}`}
          icon={<FitnessCenterIcon />}
          color="primary"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <StatsCard
          size="small"
          title="Trained This Week"
          tooltip="Athletes who trained at least once in the last 7 days"
          value={`${overview.trainedThisWeekCount} / ${overview.totalActiveAthletes}`}
          icon={<DirectionsRunIcon />}
          color={overview.trainedThisWeekCount > 0 ? "primary" : "warning"}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <StatsCard
          size="small"
          title="Need Attention"
          tooltip="Open action items requiring your review"
          value={overview.openActionItemsCount}
          icon={<WarningAmberIcon />}
          color={overview.openActionItemsCount > 0 ? "warning" : "success"}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <StatsCard
          size="small"
          title="New Athletes"
          tooltip="Athletes enrolled in the last 7 days"
          value={overview.newAthletesCount}
          icon={<PersonAddIcon />}
          color={overview.newAthletesCount > 0 ? "info" : "primary"}
        />
      </Grid>
    </Grid>
  );
};
