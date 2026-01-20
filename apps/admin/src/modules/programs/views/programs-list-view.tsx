"use client";

import { Stack } from "@mui/material";

import { type AdminProgramsPageData } from "@repo/contracts/program";
import { QueryWrapper } from "@repo/query";

import { useProgramsPageData } from "@app/lib/hooks";

import { ProgramsListSection, ProgramsStatsSection } from "../sections";

interface ProgramsListViewProps {
  initialData: AdminProgramsPageData;
}

export const ProgramsListView = ({ initialData }: ProgramsListViewProps) => {
  const { data, isLoading, error } = useProgramsPageData({ initialData });

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
          <ProgramsListSection programs={data.programs} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
