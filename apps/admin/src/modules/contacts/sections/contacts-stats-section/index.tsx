"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { Grid } from "@mui/material";

import { type ContactStats } from "@repo/contracts/contact";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface ContactsStatsSectionProps {
  stats: ContactStats;
  selectedFilter: string | null;
  onFilterChange: (key: string) => void;
}

export const ContactsStatsSection = ({
  stats,
  selectedFilter,
  onFilterChange,
}: ContactsStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Contacts Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total"
            value={stats.total}
            subtitle="All submissions"
            icon={<ContactMailIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="New"
            value={stats.new}
            subtitle="Awaiting review"
            icon={<FiberNewIcon fontSize="large" />}
            color="info"
            onClick={() => onFilterChange("new")}
            selected={selectedFilter === null ? undefined : selectedFilter === "new"}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            subtitle="Being handled"
            icon={<HourglassEmptyIcon fontSize="large" />}
            color="warning"
            onClick={() => onFilterChange("in_progress")}
            selected={selectedFilter === null ? undefined : selectedFilter === "in_progress"}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Resolved"
            value={stats.replied + stats.closed}
            subtitle="Replied & closed"
            icon={<CheckCircleIcon fontSize="large" />}
            color="success"
            onClick={() => onFilterChange("resolved")}
            selected={selectedFilter === null ? undefined : selectedFilter === "resolved"}
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
