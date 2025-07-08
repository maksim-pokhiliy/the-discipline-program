import { Typography, Grid, Paper } from "@mui/material";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface DashboardStats {
  programsCount: number;
  reviewsCount: number;
  blogPostsCount: number;
  totalRevenue: number;
}

interface DashboardStatsSectionProps {
  stats: DashboardStats;
}

export const DashboardStatsSection = ({ stats }: DashboardStatsSectionProps) => {
  return (
    <ContentSection title="Admin Dashboard" backgroundColor="dark">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {stats.programsCount}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Programs
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {stats.reviewsCount}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Reviews
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {stats.blogPostsCount}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Blog Posts
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              ${stats.totalRevenue}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Revenue
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </ContentSection>
  );
};
