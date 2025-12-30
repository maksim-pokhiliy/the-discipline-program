"use client";

import ArticleIcon from "@mui/icons-material/Article";
import DraftsIcon from "@mui/icons-material/Drafts";
import PublicIcon from "@mui/icons-material/Public";
import StarIcon from "@mui/icons-material/Star";
import { Grid } from "@mui/material";
import { BlogStats } from "@repo/api";
import { ContentSection } from "@repo/ui";

import { StatsCard } from "@app/shared/components/ui";

interface BlogStatsSectionProps {
  stats: BlogStats;
}

export const BlogStatsSection = ({ stats }: BlogStatsSectionProps) => {
  return (
    <ContentSection backgroundColor="dark" title="Blog Overview">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard
            title="Total Posts"
            value={stats.total}
            subtitle="All articles in the library"
            icon={<ArticleIcon fontSize="large" />}
            color="primary"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard
            title="Published"
            value={stats.published}
            subtitle="Live on the website"
            icon={<PublicIcon fontSize="large" />}
            color="success"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard
            title="Drafts"
            value={stats.drafts}
            subtitle="Still in progress"
            icon={<DraftsIcon fontSize="large" />}
            color="warning"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard
            title="Featured"
            value={stats.featured}
            subtitle="Highlighted articles"
            icon={<StarIcon fontSize="large" />}
            color="secondary"
          />
        </Grid>
      </Grid>
    </ContentSection>
  );
};
