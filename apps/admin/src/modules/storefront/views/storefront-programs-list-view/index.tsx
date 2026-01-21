"use client";

import { Stack } from "@mui/material";

import { type AdminStorefrontProgramsPageData } from "@repo/contracts/storefront";
import { QueryWrapper } from "@repo/query";

import { useStorefrontPageData } from "@app/lib/hooks";

import { StorefrontProgramsListSection, StorefrontStatsSection } from "../../sections";

interface StorefrontProgramsListViewProps {
  initialData: AdminStorefrontProgramsPageData;
}

export const StorefrontProgramsListView = ({ initialData }: StorefrontProgramsListViewProps) => {
  const { data, isLoading, error } = useStorefrontPageData({ initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading storefront..."
    >
      {(data) => (
        <Stack spacing={0}>
          <StorefrontStatsSection stats={data.stats} />
          <StorefrontProgramsListSection programs={data.programs} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
