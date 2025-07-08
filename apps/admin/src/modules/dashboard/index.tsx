"use client";

import { Stack } from "@mui/material";

import { useDashboardStats } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { DashboardStatsSection } from "./components/dashboard-stats";

export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboardStats();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading dashboard..."
    >
      {(data) => (
        <Stack spacing={0}>
          <DashboardStatsSection stats={data} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
