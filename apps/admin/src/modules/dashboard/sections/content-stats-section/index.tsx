"use client";

import ArticleIcon from "@mui/icons-material/Article";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import GroupIcon from "@mui/icons-material/Group";
import SportsIcon from "@mui/icons-material/Person";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { Grid } from "@mui/material";

import { type ContentStats, type UserStats } from "@repo/contracts/dashboard";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/lib/components/stats-card";

interface ContentStatsSectionProps {
  contentStats: ContentStats;
  userStats: UserStats;
}

export const ContentStatsSection = ({ contentStats, userStats }: ContentStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Overview">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Total Users"
            value={userStats.total}
            subtitle={`${userStats.newThisMonth} joined this month`}
            icon={<GroupIcon fontSize="large" />}
            color="success"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Contact Submissions"
            value={contentStats.contactSubmissions.total}
            subtitle={`${contentStats.contactSubmissions.new} new, ${contentStats.contactSubmissions.processed} processed`}
            icon={<ContactMailIcon fontSize="large" />}
            color={contentStats.contactSubmissions.new > 0 ? "warning" : "primary"}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Reviews"
            value={contentStats.reviews.total}
            subtitle={`${contentStats.reviews.active} active`}
            icon={<RateReviewIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <StatsCard
            title="Products"
            value={contentStats.products.total}
            subtitle={`${contentStats.products.active} active`}
            icon={<SportsIcon fontSize="large" />}
            color="secondary"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <StatsCard
            title="Blog Posts"
            value={contentStats.blogPosts.total}
            subtitle={`${contentStats.blogPosts.published} published`}
            icon={<ArticleIcon fontSize="large" />}
            color="secondary"
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
