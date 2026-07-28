"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CircularProgress, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type MobileLink, isGeneralMobileLink } from "@repo/contracts/coaching/mobile-link";
import { type PublishMobileResult } from "@repo/contracts/coaching/mobile-publish";
import { formatCalendarWeekday, formatDateParam } from "@repo/shared";
import { BaseModal, ConfirmationModal } from "@repo/ui";

import { isReconnectRequired } from "@app/lib/api/is-reconnect-required";
import { platformKeys } from "@app/lib/api/keys";
import { usePublishMobile } from "@app/lib/hooks";

import { ConnectMobileModal } from "../../coach-profile/components";

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
const RECONNECT_TITLE = "Reconnect mobile app";
const NO_START_DATE = "";

const errorMessage = (reason: unknown): string =>
  reason instanceof Error ? reason.message : "Publish failed";

const collectConflictDays = (groups: PublishLevelGroup[]): string[] => {
  const labels = new Set<string>();

  for (const group of groups) {
    if (group.outcome.kind !== "results") {
      continue;
    }

    for (const result of group.outcome.results) {
      if (result.action === "conflict") {
        labels.add(formatCalendarWeekday(result.scheduledDate, "long"));
      }
    }
  }

  return [...labels];
};

const hasReconnect = (groups: PublishLevelGroup[]): boolean =>
  groups.some((group) => group.outcome.kind === "reconnect");

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

    if (isReconnectRequired(outcome.reason)) {
      return { linkId, heading, outcome: { kind: "reconnect" } };
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReconnectOpen, setIsReconnectOpen] = useState(false);

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

  const runPublish = useCallback(
    async (overwrite: boolean): Promise<void> => {
      if (isRunningRef.current) {
        return;
      }

      isRunningRef.current = true;
      const myRunId = runIdRef.current;

      if (!overwrite) {
        runLinksRef.current = links;
        runStartDateRef.current = formatDateParam(monday);
      }

      const runLinks = runLinksRef.current;
      const startDate = runStartDateRef.current;

      try {
        setIsPublishing(true);
        setIsConfirmOpen(false);

        const settled = await Promise.allSettled(
          runLinks.map(async (link) => ({
            link,
            result: await publishMobile.mutateAsync({
              linkId: link.id,
              startDate,
              scope: "week",
              overwriteUnowned: overwrite,
            }),
          })),
        );

        queryClient.invalidateQueries({ queryKey: platformKeys.mobile.links(planId) });

        if (myRunId !== runIdRef.current) {
          return;
        }

        const nextGroups = toPublishGroups(settled, runLinks, resolveHeading);

        setGroups(nextGroups);
        setIsPublishing(false);

        if (!overwrite && collectConflictDays(nextGroups).length > 0) {
          setIsConfirmOpen(true);
        }
      } finally {
        isRunningRef.current = false;
      }
    },
    [links, monday, planId, publishMobile, queryClient, resolveHeading],
  );

  const latestRunPublish = useRef(runPublish);

  latestRunPublish.current = runPublish;

  useEffect(() => {
    if (!open) {
      runIdRef.current += 1;
      hasStartedRef.current = false;
      runLinksRef.current = [];
      runStartDateRef.current = NO_START_DATE;
      setGroups([]);
      setIsPublishing(false);
      setIsConfirmOpen(false);
      setIsReconnectOpen(false);

      return;
    }

    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    void latestRunPublish.current(false);
  }, [open]);

  const handleConfirmOverwrite = () => {
    void runPublish(true);
  };

  const handleReconnected = () => {
    setIsReconnectOpen(false);
    void runPublish(false);
  };

  const conflictDays = collectConflictDays(groups);
  const conflictCount = conflictDays.length;
  const showReconnect = hasReconnect(groups);

  return (
    <>
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
          <PublishResultsPanel
            groups={groups}
            {...(showReconnect && { onReconnect: () => setIsReconnectOpen(true) })}
          />
        )}
      </BaseModal>

      <ConfirmationModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        type="warning"
        title="Overwrite existing days?"
        confirmText="Overwrite & publish"
        message={`${conflictCount} ${conflictCount === 1 ? "day" : "days"} already have content you didn't publish from here. Overwrite & publish?`}
        details={conflictDays.join(", ")}
        onConfirm={handleConfirmOverwrite}
      />

      <ConnectMobileModal
        open={isReconnectOpen}
        onClose={() => setIsReconnectOpen(false)}
        onConnected={handleReconnected}
        title={RECONNECT_TITLE}
      />
    </>
  );
};
