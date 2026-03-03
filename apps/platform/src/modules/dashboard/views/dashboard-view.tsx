"use client";

import { Stack } from "@mui/material";

import { QueryWrapper } from "@repo/query";

import { useCoachDashboard } from "@app/lib/hooks";

import { ActionItemsSection, OverviewSection } from "../sections";

export const DashboardView = () => {
  const { data, isLoading, error } = useCoachDashboard();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading dashboard..."
    >
      {(data) => (
        <Stack spacing={{ xs: 1.5, md: 3 }}>
          <OverviewSection overview={data.overview} />
          <ActionItemsSection items={data.actionItems} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
