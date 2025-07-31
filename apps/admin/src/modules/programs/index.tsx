"use client";

import { Stack } from "@mui/material";

import { useProgramsPageData } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { ProgramsStatsSection } from "./sections/programs-stats-section";
import { ProgramsTableSection } from "./sections/programs-table-section";

export const ProgramsPage = () => {
  const { data, isLoading, error } = useProgramsPageData();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading programs..."
    >
      {(data) => (
        <Stack spacing={0}>
          <ProgramsStatsSection stats={data.stats} />
          <ProgramsTableSection programs={data.programs} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
