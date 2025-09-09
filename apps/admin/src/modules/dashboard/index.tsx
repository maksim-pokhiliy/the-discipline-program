"use client";

import { Stack } from "@mui/material";

import { useDashboardData } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/providers";

import { BusinessStatsSection, ContentStatsSection, QuickActionsSection } from "./sections";

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
        <Stack>
          <ContentStatsSection contentStats={data.contentStats} />
          <BusinessStatsSection businessStats={data.businessStats} />
          <QuickActionsSection />
        </Stack>
      )}
    </QueryWrapper>
  );
};
