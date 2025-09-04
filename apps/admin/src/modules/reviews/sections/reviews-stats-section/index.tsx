"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import StarIcon from "@mui/icons-material/Star";
import { Grid } from "@mui/material";
import { ReviewStats } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";
import { StatsCard } from "@app/shared/components/ui/stats-card";

interface ReviewsStatsSectionProps {
  stats: ReviewStats;
}

export const ReviewsStatsSection = ({ stats }: ReviewsStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Reviews Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Total Reviews"
            value={stats.total}
            subtitle="All client reviews"
            icon={<RateReviewIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Active Reviews"
            value={stats.active}
            subtitle="Visible on website"
            icon={<CheckCircleIcon fontSize="large" />}
            color="success"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard
            title="Featured Reviews"
            value={stats.featured}
            subtitle="Shown on homepage"
            icon={<StarIcon fontSize="large" />}
            color="secondary"
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
