"use client";

import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { Grid } from "@mui/material";

import { type ProductsStats } from "@repo/contracts/product";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface ProductsStatsSectionProps {
  stats: ProductsStats;
  selectedFilter: string | null;
  onFilterChange: (key: string) => void;
}

export const ProductsStatsSection = ({
  stats,
  selectedFilter,
  onFilterChange,
}: ProductsStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Product Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Total Products"
            value={stats.total}
            subtitle="All products"
            icon={<PsychologyIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Active Products"
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
            title="Inactive Products"
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
