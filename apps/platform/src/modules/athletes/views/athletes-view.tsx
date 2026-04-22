"use client";

import { useCallback, useState } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Button, Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeader, QueryWrapper } from "@repo/ui";

import { useCoachAthletes } from "@app/lib/hooks";

import { AthleteDetailDrawer, InviteAthleteDialog, extractUniquePlans } from "../components";
import { AthletesFiltersSection, AthletesListSection, AthletesSummarySection } from "../sections";

export const AthletesView = () => {
  const { data, isLoading, error } = useCoachAthletes();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);

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
      <PageHeader
        title="Athletes"
        actions={
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteOpen(true)}
          >
            Invite athlete
          </Button>
        }
      />

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
      <InviteAthleteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Stack>
  );
};
