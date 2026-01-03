"use client";

import ArticleIcon from "@mui/icons-material/Article";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import SportsIcon from "@mui/icons-material/Person";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { Grid } from "@mui/material";

import { type ContentStats } from "@repo/contracts/dashboard";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface ContentStatsSectionProps {
  contentStats: ContentStats;
}

export const ContentStatsSection = ({ contentStats }: ContentStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Content Statistics">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Programs"
            value={contentStats.programs.total}
            subtitle={`${contentStats.programs.active} active, ${contentStats.programs.inactive} inactive`}
            icon={<SportsIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Reviews"
            value={contentStats.reviews.total}
            subtitle={`${contentStats.reviews.featured} featured, ${contentStats.reviews.active} active`}
            icon={<RateReviewIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Blog Posts"
            value={contentStats.blogPosts.total}
            subtitle={`${contentStats.blogPosts.published} published, ${contentStats.blogPosts.drafts} drafts`}
            icon={<ArticleIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Contact Submissions"
            value={contentStats.contactSubmissions.total}
            subtitle={`${contentStats.contactSubmissions.new} new, ${contentStats.contactSubmissions.processed} processed`}
            icon={<ContactMailIcon fontSize="large" />}
            color={contentStats.contactSubmissions.new > 0 ? "warning" : "success"}
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
