"use client";

import { useMemo } from "react";

import { Alert, Box, CircularProgress, Stack } from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import type { IndividualMobileLink } from "@repo/contracts/coaching/mobile-link";
import { EnrollmentStatus, type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";
import { EmptyState } from "@repo/ui";

import {
  useCoachAthletes,
  useCreateMobileLink,
  useDeleteMobileLink,
  useMobileAthletes,
  usePlanEnrollments,
} from "@app/lib/hooks";

import { IndividualLinkRow } from "./individual-link-row";

const PICKLIST_MAX_HEIGHT = 280;
const ATHLETES_ERROR_MESSAGE = "Couldn't load athletes. Try again.";
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
  individualLinks: IndividualMobileLink[];
};

export const IndividualLinksSection: React.FC<IndividualLinksSectionProps> = ({
  planId,
  individualLinks,
}) => {
  const enrollmentsQuery = usePlanEnrollments(planId);
  const athletesQuery = useCoachAthletes();
  const mobileAthletesQuery = useMobileAthletes(planId);
  const createLink = useCreateMobileLink(planId);
  const deleteLink = useDeleteMobileLink(planId);

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

  const linkableAthleteIds = useMemo(
    () => new Set((mobileAthletesQuery.data ?? []).map((athlete) => athlete.athleteId)),
    [mobileAthletesQuery.data],
  );

  const rows = useMemo(
    () => buildRows(enrolledAthleteIds, individualLinks, rosterById, linkByAthleteId),
    [enrolledAthleteIds, individualLinks, rosterById, linkByAthleteId],
  );

  const linkedRows = useMemo(() => rows.filter((row) => row.existingLink !== undefined), [rows]);
  const unlinkedRows = useMemo(() => rows.filter((row) => row.existingLink === undefined), [rows]);

  const isRosterPending = enrollmentsQuery.isPending || athletesQuery.isPending;
  const isMutating = createLink.isPending || deleteLink.isPending;

  const renderRow = (row: IndividualRowModel): React.ReactNode => (
    <IndividualLinkRow
      key={row.athleteId}
      displayName={row.displayName}
      image={row.image}
      athleteId={row.athleteId}
      {...(row.existingLink !== undefined && { existingLink: row.existingLink })}
      canLink={linkableAthleteIds.has(row.athleteId)}
      onLink={() => createLink.mutate({ planId, channel: "INDIVIDUAL", athleteId: row.athleteId })}
      onUnlink={() => {
        if (row.existingLink !== undefined) {
          deleteLink.mutate(row.existingLink.id);
        }
      }}
      isMutating={isMutating}
    />
  );

  const renderAddAffordance = (): React.ReactNode => {
    if (unlinkedRows.length === 0) {
      return null;
    }

    if (mobileAthletesQuery.isError) {
      return <Alert severity="error">{ATHLETES_ERROR_MESSAGE}</Alert>;
    }

    if (mobileAthletesQuery.isPending) {
      return (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={20} />
        </Stack>
      );
    }

    return unlinkedRows.map(renderRow);
  };

  if (isRosterPending) {
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
        {linkedRows.map(renderRow)}

        {renderAddAffordance()}
      </Stack>
    </Box>
  );
};
