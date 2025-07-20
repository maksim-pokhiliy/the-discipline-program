"use client";

import { Stack } from "@mui/material";

import { useDashboardData } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { BusinessStatsSection } from "./sections/business-stats-section";
import { ContentStatsSection } from "./sections/content-stats-section";
import { QuickActionsSection } from "./sections/quick-actions-section";

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
