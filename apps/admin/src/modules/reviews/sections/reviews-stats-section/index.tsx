"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { Grid } from "@mui/material";

import { type ReviewStats } from "@repo/contracts/review";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface ReviewsStatsSectionProps {
  stats: ReviewStats;
}

export const ReviewsStatsSection = ({ stats }: ReviewsStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Reviews Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StatsCard
            title="Total Reviews"
            value={stats.total}
            subtitle="All client reviews"
            icon={<RateReviewIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <StatsCard
            title="Active Reviews"
            value={stats.active}
            subtitle="Visible on website"
            icon={<CheckCircleIcon fontSize="large" />}
            color="success"
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
