"use client";

import { Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import type { CoachDashboardData } from "@repo/contracts/coach-dashboard";
import { platformKeys, QueryWrapper, STALE_TIMES } from "@repo/query";

import { api } from "@app/lib/api";

import { ActionItemsSection } from "../sections";

type DashboardViewProps = {
  initialData: CoachDashboardData;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ initialData }) => {
  const query = useQuery({
    queryKey: platformKeys.coachDashboard.data(),
    queryFn: () => api.coachDashboard.getDashboard(),
    initialData,
    staleTime: STALE_TIMES.SHORT,
  });

  return (
    <QueryWrapper isLoading={query.isLoading} error={query.error} data={query.data}>
      {(data) => (
        <Stack spacing={2}>
          <ActionItemsSection items={data.actionItems} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
