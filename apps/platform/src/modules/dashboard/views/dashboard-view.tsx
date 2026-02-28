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
        <Stack spacing={2}>
          <OverviewSection overview={data.overview} />
          <ActionItemsSection items={data.actionItems} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
