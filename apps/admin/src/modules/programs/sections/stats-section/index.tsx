"use client";

import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { Grid } from "@mui/material";
import { ProgramStats } from "@repo/api";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface ProgramsStatsSectionProps {
  stats: ProgramStats;
}

export const ProgramsStatsSection = ({ stats }: ProgramsStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Programs Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Total Programs"
            value={stats.total}
            subtitle="All training programs"
            icon={<PsychologyIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Active Programs"
            value={stats.active}
            subtitle="Currently available"
            icon={<CheckCircleIcon fontSize="large" />}
            color="success"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Inactive Programs"
            value={stats.inactive}
            subtitle="Hidden from users"
            icon={<CancelIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
