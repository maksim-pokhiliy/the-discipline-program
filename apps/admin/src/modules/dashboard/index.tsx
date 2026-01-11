"use client";

import { Stack } from "@mui/material";

import { type DashboardData } from "@repo/contracts/dashboard";
import { QueryWrapper } from "@repo/query";

import { useDashboardData } from "@app/lib/hooks";

import { ContentStatsSection, QuickActionsSection } from "./sections";

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
        <Stack spacing={4}>
          <ContentStatsSection contentStats={data.contentStats} />
          <QuickActionsSection />
        </Stack>
      )}
    </QueryWrapper>
  );
};
