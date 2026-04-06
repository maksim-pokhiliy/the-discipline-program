"use client";

import { useCallback } from "react";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { QueryWrapper } from "@repo/query";

import { PlatformPageHeader } from "@app/lib/components";
import { useCoachAthletes } from "@app/lib/hooks";

import { AthleteDetailDrawer } from "../components";
import { extractUniquePlans } from "../components/athlete-list-item-config";
import { AthletesFiltersSection, AthletesListSection, AthletesSummarySection } from "../sections";

export const AthletesView = () => {
  const { data, isLoading, error } = useCoachAthletes();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedAthleteId = searchParams.get("athlete");

  const handleSelectAthlete = useCallback(
    (userId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("athlete", userId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handleCloseDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("athlete");
    const qs = params.toString();

    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

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
              <AthletesListSection athletes={data.athletes} onSelectAthlete={handleSelectAthlete} />
            </Stack>
          );
        }}
      </QueryWrapper>

      <AthleteDetailDrawer athleteId={selectedAthleteId} onClose={handleCloseDrawer} />
    </Stack>
  );
};
