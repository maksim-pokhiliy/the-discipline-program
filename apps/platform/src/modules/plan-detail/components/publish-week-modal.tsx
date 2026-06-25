"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CircularProgress, Stack, Typography } from "@mui/material";

import type { MobileLink } from "@repo/contracts/coaching/mobile-link";
import { DEFAULT_LOCALE, formatDateParam } from "@repo/shared";
import { BaseModal, ConfirmationModal } from "@repo/ui";

import { isReconnectRequired } from "@app/lib/api/is-reconnect-required";
import { usePublishMobile } from "@app/lib/hooks";

import { ConnectMobileModal } from "../../coach-profile/components";

import { PublishResultsPanel, type PublishLevelGroup } from "./publish-results-panel";

type PublishWeekModalProps = {
  open: boolean;
  onClose: () => void;
  monday: Date;
  links: MobileLink[];
  levelNameById: Map<number, string>;
};

const PUBLISHING_MESSAGE = "Publishing this week…";
const RECONNECT_TITLE = "Reconnect mobile app";

const errorMessage = (reason: unknown): string =>
  reason instanceof Error ? reason.message : "Publish failed";

const formatConflictDayLabel = (scheduledDate: string): string =>
  new Date(`${scheduledDate}T00:00:00Z`).toLocaleDateString(DEFAULT_LOCALE, {
    weekday: "long",
    timeZone: "UTC",
  });

const collectConflictDays = (groups: PublishLevelGroup[]): string[] => {
  const labels = new Set<string>();

  for (const group of groups) {
    if (group.outcome.kind !== "results") {
      continue;
    }

    for (const result of group.outcome.results) {
      if (result.action === "conflict") {
        labels.add(formatConflictDayLabel(result.scheduledDate));
      }
    }
  }

  return [...labels];
};

const hasReconnect = (groups: PublishLevelGroup[]): boolean =>
  groups.some((group) => group.outcome.kind === "reconnect");

export const PublishWeekModal: React.FC<PublishWeekModalProps> = ({
  open,
  onClose,
  monday,
  links,
  levelNameById,
}) => {
  const publishMobile = usePublishMobile();

  const [groups, setGroups] = useState<PublishLevelGroup[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReconnectOpen, setIsReconnectOpen] = useState(false);

  const hasStartedRef = useRef(false);
  const runIdRef = useRef(0);
  const isRunningRef = useRef(false);

  const resolveLevelName = useCallback(
    (link: MobileLink): string =>
      levelNameById.get(link.legacyLevelId) ?? `Level ${link.legacyLevelId}`,
    [levelNameById],
  );

  const runPublish = useCallback(
    async (overwrite: boolean): Promise<void> => {
      if (isRunningRef.current) {
        return;
      }

      isRunningRef.current = true;
      const myRunId = runIdRef.current;

      try {
        const startDate = formatDateParam(monday);

        setIsPublishing(true);
        setIsConfirmOpen(false);

        const settled = await Promise.allSettled(
          links.map(async (link) => ({
            link,
            result: await publishMobile.mutateAsync({
              linkId: link.id,
              startDate,
              scope: "week",
              overwriteUnowned: overwrite,
            }),
          })),
        );

        if (myRunId !== runIdRef.current) {
          return;
        }

        const nextGroups = settled.map((outcome, index): PublishLevelGroup => {
          const link = links[index];
          const linkId = link === undefined ? String(index) : link.id;
          const levelName = link === undefined ? "" : resolveLevelName(link);

          if (outcome.status === "fulfilled") {
            return {
              linkId,
              levelName,
              outcome: { kind: "results", results: outcome.value.result.results },
            };
          }

          if (isReconnectRequired(outcome.reason)) {
            return { linkId, levelName, outcome: { kind: "reconnect" } };
          }

          return {
            linkId,
            levelName,
            outcome: { kind: "error", message: errorMessage(outcome.reason) },
          };
        });

        setGroups(nextGroups);
        setIsPublishing(false);

        if (!overwrite && collectConflictDays(nextGroups).length > 0) {
          setIsConfirmOpen(true);
        }
      } finally {
        isRunningRef.current = false;
      }
    },
    [links, monday, publishMobile, resolveLevelName],
  );

  useEffect(() => {
    if (!open) {
      runIdRef.current += 1;
      isRunningRef.current = false;
      hasStartedRef.current = false;
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
    void runPublish(false);
  }, [open, runPublish]);

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
        isConfirming={isPublishing}
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
