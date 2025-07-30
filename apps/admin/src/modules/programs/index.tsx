"use client";

import { Stack } from "@mui/material";

import { useProgramsStats } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { ProgramsStatsSection } from "./sections/programs-stats-section";

export const ProgramsPage = () => {
  const { data, isLoading, error } = useProgramsStats();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading programs..."
    >
      {(stats) => (
        <Stack>
          <ProgramsStatsSection stats={stats} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
