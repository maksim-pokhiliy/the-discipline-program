"use client";

import { Stack } from "@mui/material";

import { QueryWrapper } from "@repo/query";

import { PlatformPageHeader } from "@app/lib/components";
import { useCoachAthletes } from "@app/lib/hooks";

import { extractUniquePlans } from "../components/athlete-list-item-config";
import { AthletesFiltersSection, AthletesListSection, AthletesSummarySection } from "../sections";

export const AthletesView = () => {
  const { data, isLoading, error } = useCoachAthletes();

  return (
    <Stack spacing={4}>
      <PlatformPageHeader title="Athletes" />

      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading athletes..."
      >
        {(data) => {
          const uniquePlans = extractUniquePlans(data.athletes);

          return (
            <Stack spacing={{ xs: 2, md: 3 }}>
              <AthletesSummarySection summary={data.summary} />
              <AthletesFiltersSection plans={uniquePlans} />
              <AthletesListSection athletes={data.athletes} />
            </Stack>
          );
        }}
      </QueryWrapper>
    </Stack>
  );
};
