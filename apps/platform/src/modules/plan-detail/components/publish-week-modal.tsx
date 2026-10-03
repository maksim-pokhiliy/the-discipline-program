"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CircularProgress, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type MobileLink, isGeneralMobileLink } from "@repo/contracts/coaching/mobile-link";
import { type PublishMobileResult } from "@repo/contracts/coaching/mobile-publish";
import { formatDateParam } from "@repo/shared";
import { BaseModal } from "@repo/ui";

import { platformKeys } from "@app/lib/api/keys";
import { usePublishMobile } from "@app/lib/hooks";

import { PublishResultsPanel, type PublishLevelGroup } from "./publish-results-panel";

type PublishWeekModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  monday: Date;
  links: MobileLink[];
  levelNameById: Map<number, string>;
  athleteNameById: Map<string, string>;
};

const PUBLISHING_MESSAGE = "Publishing this week…";
const NO_START_DATE = "";

const errorMessage = (reason: unknown): string =>
  reason instanceof Error ? reason.message : "Publish failed";

type PublishRunOutcome = PromiseSettledResult<{ link: MobileLink; result: PublishMobileResult }>;

const toPublishGroups = (
  settled: PublishRunOutcome[],
  runLinks: MobileLink[],
  resolveHeading: (link: MobileLink) => string,
): PublishLevelGroup[] =>
  settled.map((outcome, index): PublishLevelGroup => {
    const link = runLinks[index];
    const linkId = link === undefined ? String(index) : link.id;
    const heading = link === undefined ? "" : resolveHeading(link);

    if (outcome.status === "fulfilled") {
      return {
        linkId,
        heading,
        outcome: { kind: "results", results: outcome.value.result.results },
      };
    }

    return { linkId, heading, outcome: { kind: "error", message: errorMessage(outcome.reason) } };
  });

export const PublishWeekModal: React.FC<PublishWeekModalProps> = ({
  open,
  onClose,
  planId,
  monday,
  links,
  levelNameById,
  athleteNameById,
}) => {
  const publishMobile = usePublishMobile();
  const queryClient = useQueryClient();

  const [groups, setGroups] = useState<PublishLevelGroup[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const hasStartedRef = useRef(false);
  const runIdRef = useRef(0);
  const isRunningRef = useRef(false);
  const runLinksRef = useRef<MobileLink[]>([]);
  const runStartDateRef = useRef(NO_START_DATE);

  const resolveHeading = useCallback(
    (link: MobileLink): string =>
      isGeneralMobileLink(link)
        ? (levelNameById.get(link.legacyLevelId) ?? `Level ${link.legacyLevelId}`)
        : (athleteNameById.get(link.athleteId) ?? `Athlete #${link.legacyUserId}`),
    [levelNameById, athleteNameById],
  );

  const runPublish = useCallback(async (): Promise<void> => {
    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;
    const myRunId = runIdRef.current;
    const runLinks = runLinksRef.current;
    const startDate = runStartDateRef.current;

    try {
      setIsPublishing(true);

      const settled = await Promise.allSettled(
        runLinks.map(async (link) => ({
          link,
          result: await publishMobile.mutateAsync({
            linkId: link.id,
            startDate,
            scope: "week",
          }),
        })),
      );

      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.links(planId) });

      if (myRunId !== runIdRef.current) {
        return;
      }

      setGroups(toPublishGroups(settled, runLinks, resolveHeading));
      setIsPublishing(false);
    } finally {
      isRunningRef.current = false;
    }
  }, [planId, publishMobile, queryClient, resolveHeading]);

  const latestRunPublish = useRef(runPublish);
  const latestRunInput = useRef({ links, monday });

  latestRunPublish.current = runPublish;
  latestRunInput.current = { links, monday };

  useEffect(() => {
    if (!open) {
      if (isRunningRef.current) {
        return;
      }

      runIdRef.current += 1;
      hasStartedRef.current = false;
      runLinksRef.current = [];
      runStartDateRef.current = NO_START_DATE;
      setGroups([]);
      setIsPublishing(false);

      return;
    }

    const startDate = formatDateParam(latestRunInput.current.monday);

    if (hasStartedRef.current && (isRunningRef.current || runStartDateRef.current === startDate)) {
      return;
    }

    hasStartedRef.current = true;
    runLinksRef.current = latestRunInput.current.links;
    runStartDateRef.current = startDate;
    setGroups([]);
    void latestRunPublish.current();
  }, [open]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Publish week"
      disableBackdropClick={isPublishing}
      disableEscapeKeyDown={isPublishing}
    >
      {isPublishing ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />

          <Typography variant="body2" color="text.secondary">
            {PUBLISHING_MESSAGE}
          </Typography>
        </Stack>
      ) : (
        <PublishResultsPanel groups={groups} />
      )}
    </BaseModal>
  );
};
