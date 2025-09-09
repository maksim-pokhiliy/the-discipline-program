"use client";

import { Stack } from "@mui/material";

import { useProgramsPageData } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/providers";

import { ProgramsStatsSection, ProgramsTableSection } from "./sections";

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
