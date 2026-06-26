"use client";

import { useMemo, useState } from "react";

import { Alert, Box, Button, CircularProgress, Stack } from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import type { MobileAthlete } from "@repo/contracts/coaching/legacy-mobile";
import type { IndividualMobileLink } from "@repo/contracts/coaching/mobile-link";
import { EnrollmentStatus, type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";
import { EmptyState } from "@repo/ui";

import { isReconnectRequired } from "@app/lib/api/is-reconnect-required";
import {
  useCoachAthletes,
  useCreateMobileLink,
  useDeleteMobileLink,
  useMobileAthletes,
  usePlanEnrollments,
} from "@app/lib/hooks";

import { ConnectMobileModal } from "../../coach-profile/components";

import { IndividualLinkRow } from "./individual-link-row";

const PICKLIST_MAX_HEIGHT = 280;
const RECONNECT_MESSAGE = "Connection expired. Reconnect to link athletes.";
const ATHLETES_ERROR_MESSAGE = "Couldn't load athletes. Try again.";
const RECONNECT_TITLE = "Reconnect mobile app";
const EMPTY_MESSAGE = "No enrolled athletes to link yet.";
const UNKNOWN_ATHLETE_LABEL = "Unknown athlete";

type IndividualRowModel = {
  athleteId: string;
  displayName: string;
  image: string | null;
  existingLink: IndividualMobileLink | undefined;
};

const isLiveEnrollment = (enrollment: PlanEnrollment): boolean =>
  enrollment.status === EnrollmentStatus.ACTIVE || enrollment.status === EnrollmentStatus.PAUSED;

const buildRows = (
  enrolledAthleteIds: Set<string>,
  individualLinks: IndividualMobileLink[],
  rosterById: Map<string, CoachAthleteListItem>,
  linkByAthleteId: Map<string, IndividualMobileLink>,
): IndividualRowModel[] => {
  const athleteIds = new Set([
    ...enrolledAthleteIds,
    ...individualLinks.map((link) => link.athleteId),
  ]);

  return [...athleteIds]
    .map((athleteId) => {
      const athlete = rosterById.get(athleteId);

      return {
        athleteId,
        displayName: athlete?.name ?? athlete?.email ?? UNKNOWN_ATHLETE_LABEL,
        image: athlete?.image ?? null,
        existingLink: linkByAthleteId.get(athleteId),
      };
    })
    .sort((first, second) => first.displayName.localeCompare(second.displayName));
};

type IndividualLinksSectionProps = {
  planId: string;
  isConnected: boolean;
  individualLinks: IndividualMobileLink[];
};

export const IndividualLinksSection: React.FC<IndividualLinksSectionProps> = ({
  planId,
  isConnected,
  individualLinks,
}) => {
  const enrollmentsQuery = usePlanEnrollments(planId);
  const athletesQuery = useCoachAthletes();
  const mobileAthletesQuery = useMobileAthletes(isConnected);
  const createLink = useCreateMobileLink(planId);
  const deleteLink = useDeleteMobileLink(planId);

  const [isConnectOpen, setIsConnectOpen] = useState<boolean>(false);

  const rosterById = useMemo(() => {
    const map = new Map<string, CoachAthleteListItem>();

    for (const athlete of athletesQuery.data?.athletes ?? []) {
      map.set(athlete.userId, athlete);
    }

    return map;
  }, [athletesQuery.data]);

  const enrolledAthleteIds = useMemo(
    () =>
      new Set(
        (enrollmentsQuery.data ?? [])
          .filter(isLiveEnrollment)
          .map((enrollment) => enrollment.athleteId),
      ),
    [enrollmentsQuery.data],
  );

  const linkByAthleteId = useMemo(
    () => new Map(individualLinks.map((link) => [link.athleteId, link])),
    [individualLinks],
  );

  const linkedLegacyUserIds = useMemo(
    () => new Set(individualLinks.map((link) => link.legacyUserId)),
    [individualLinks],
  );

  const legacyAthletes = useMemo<MobileAthlete[]>(
    () => mobileAthletesQuery.data ?? [],
    [mobileAthletesQuery.data],
  );

  const legacyAthleteById = useMemo(
    () => new Map(legacyAthletes.map((athlete) => [athlete.id, athlete])),
    [legacyAthletes],
  );

  const legacyOptions = useMemo(
    () => legacyAthletes.filter((athlete) => !linkedLegacyUserIds.has(athlete.id)),
    [legacyAthletes, linkedLegacyUserIds],
  );

  const rows = useMemo(
    () => buildRows(enrolledAthleteIds, individualLinks, rosterById, linkByAthleteId),
    [enrolledAthleteIds, individualLinks, rosterById, linkByAthleteId],
  );

  const isReconnect =
    mobileAthletesQuery.error !== null && isReconnectRequired(mobileAthletesQuery.error);
  const hasAthletesError = mobileAthletesQuery.isError && !isReconnect;
  const isLoading = isConnected && mobileAthletesQuery.isPending;
  const isMutating = createLink.isPending || deleteLink.isPending;

  if (isReconnect) {
    return (
      <>
        <Stack spacing={2}>
          <Alert severity="warning">{RECONNECT_MESSAGE}</Alert>

          <Button variant="contained" onClick={() => setIsConnectOpen(true)}>
            Reconnect
          </Button>
        </Stack>

        <ConnectMobileModal
          open={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          onConnected={() => setIsConnectOpen(false)}
          title={RECONNECT_TITLE}
        />
      </>
    );
  }

  if (hasAthletesError) {
    return <Alert severity="error">{ATHLETES_ERROR_MESSAGE}</Alert>;
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (rows.length === 0) {
    return <EmptyState message={EMPTY_MESSAGE} />;
  }

  return (
    <Box sx={{ maxHeight: PICKLIST_MAX_HEIGHT, overflowY: "auto" }}>
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <IndividualLinkRow
            key={row.athleteId}
            displayName={row.displayName}
            image={row.image}
            athleteId={row.athleteId}
            {...(row.existingLink !== undefined && { existingLink: row.existingLink })}
            legacyOptions={legacyOptions}
            legacyAthleteById={legacyAthleteById}
            onLink={(legacyUserId) =>
              createLink.mutate({
                planId,
                channel: "INDIVIDUAL",
                athleteId: row.athleteId,
                legacyUserId,
              })
            }
            onUnlink={() => {
              if (row.existingLink !== undefined) {
                deleteLink.mutate(row.existingLink.id);
              }
            }}
            isMutating={isMutating}
          />
        ))}
      </Stack>
    </Box>
  );
};
