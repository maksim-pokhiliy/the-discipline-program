"use client";

import { Stack } from "@mui/material";

import { QueryWrapper } from "@repo/query";

import { useCoachDashboard } from "@app/lib/hooks";

import { ActionItemsSection, AthletesTodaySection, PulseSection } from "../sections";

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
        <Stack spacing={{ xs: 2, md: 3 }}>
          <PulseSection overview={data.overview} />
          <ActionItemsSection items={data.actionItems} />
          <AthletesTodaySection athletes={data.athletesSummary} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
