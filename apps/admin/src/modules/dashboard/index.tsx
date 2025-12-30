"use client";

import { Stack } from "@mui/material";
import { DashboardData } from "@repo/api";
import { QueryWrapper } from "@repo/query";

import { useDashboardData } from "@app/lib/hooks";

import { BusinessStatsSection, ContentStatsSection, QuickActionsSection } from "./sections";

interface DashboardPageClientProps {
  initialData: DashboardData;
}

export const DashboardPageClient = ({ initialData }: DashboardPageClientProps) => {
  const { data, isLoading, error } = useDashboardData({ initialData });

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
