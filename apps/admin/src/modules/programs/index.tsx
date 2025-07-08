"use client";

import { Stack } from "@mui/material";

import { usePrograms } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { ProgramsHeaderSection } from "./components/programs-header";
import { ProgramsTableSection } from "./components/programs-table-section";

export const ProgramsPage = () => {
  const { data, isLoading, error } = usePrograms();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading programs..."
    >
      {(data) => (
        <Stack spacing={0}>
          <ProgramsHeaderSection />
          <ProgramsTableSection programs={data} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
