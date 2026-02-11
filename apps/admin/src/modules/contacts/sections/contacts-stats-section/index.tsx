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
}

export const ContactsStatsSection = ({ stats }: ContactsStatsSectionProps) => {
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
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            subtitle="Being handled"
            icon={<HourglassEmptyIcon fontSize="large" />}
            color="warning"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Closed"
            value={stats.closed}
            subtitle="Resolved"
            icon={<CheckCircleIcon fontSize="large" />}
            color="success"
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
