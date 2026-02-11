"use client";

import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { Grid } from "@mui/material";

import { type StorefrontProgramsStats } from "@repo/contracts/storefront";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface StorefrontStatsSectionProps {
  stats: StorefrontProgramsStats;
  selectedFilter: string | null;
  onFilterChange: (key: string) => void;
}

export const StorefrontStatsSection = ({
  stats,
  selectedFilter,
  onFilterChange,
}: StorefrontStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Storefront Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Total Programs"
            value={stats.total}
            subtitle="All storefront programs"
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
            onClick={() => onFilterChange("active")}
            selected={selectedFilter === null ? undefined : selectedFilter === "active"}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Inactive Programs"
            value={stats.inactive}
            subtitle="Hidden from users"
            icon={<CancelIcon fontSize="large" />}
            color="warning"
            onClick={() => onFilterChange("inactive")}
            selected={selectedFilter === null ? undefined : selectedFilter === "inactive"}
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
