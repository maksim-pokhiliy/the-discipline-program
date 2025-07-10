"use client";

import { Stack, Grid } from "@mui/material";

import { useDashboardData } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { DashboardStatsSection } from "./components/dashboard-stats";
import { QuickActionsSection } from "./components/quick-actions";
import { RecentActivitySection } from "./components/recent-activity";

export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboardData();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading dashboard..."
    >
      {(data) => (
        <Stack spacing={6} sx={{ p: 3 }}>
          <DashboardStatsSection stats={data.stats} />

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <RecentActivitySection activities={data.recentActivity} />
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <QuickActionsSection quickStats={data.quickStats} />
            </Grid>
          </Grid>
        </Stack>
      )}
    </QueryWrapper>
  );
};
