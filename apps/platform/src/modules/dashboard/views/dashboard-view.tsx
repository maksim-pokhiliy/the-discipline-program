"use client";

import { Stack } from "@mui/material";

import { QueryWrapper } from "@repo/query";

import { useCoachDashboard } from "@app/lib/hooks";

import { ActionItemsSection } from "../sections";

export const DashboardView = () => {
  const { data, isLoading, error } = useCoachDashboard();

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data}>
      {(data) => (
        <Stack spacing={2}>
          <ActionItemsSection items={data.actionItems} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
