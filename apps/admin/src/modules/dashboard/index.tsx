"use client";

import { Stack } from "@mui/material";

import { QueryWrapper } from "@repo/ui";

import { useDashboardData } from "@app/lib/hooks";

import { ContentStatsSection, RecentActivitySection } from "./sections";

export const DashboardPageClient = () => {
  const { data, isLoading, error } = useDashboardData();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading dashboard..."
    >
      {(data) => (
        <Stack>
          <ContentStatsSection contentStats={data.contentStats} userStats={data.userStats} />

          <RecentActivitySection activity={data.recentActivity} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
