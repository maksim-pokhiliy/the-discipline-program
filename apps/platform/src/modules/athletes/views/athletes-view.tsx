"use client";

import { useCallback, useState } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Button, Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PlatformPageHeader, QueryWrapper } from "@repo/ui";

import { useCoachAthletes } from "@app/lib/hooks";

import { InviteAthleteDialog } from "../components";

import { AthletesRoster } from "./athletes-roster";

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
    <Stack spacing={3}>
      <PlatformPageHeader
        title="Athletes"
        {...(data && {
          eyebrow:
            data.summary.needsAttention > 0
              ? `${data.summary.active} active · ${data.summary.needsAttention} needs attention`
              : `${data.summary.active} active`,
        })}
        actions={
          <Button
            variant="contained"
            size="small"
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
        {(loaded) => (
          <AthletesRoster
            athletes={loaded.athletes}
            onOpenAthlete={handleSelectAthlete}
            onInvite={() => setInviteOpen(true)}
            selectedAthleteId={selectedAthleteId}
            onCloseDrawer={handleCloseDrawer}
          />
        )}
      </QueryWrapper>

      <InviteAthleteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Stack>
  );
};
