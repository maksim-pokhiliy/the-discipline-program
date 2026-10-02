"use client";

import { useMemo, useState } from "react";

import SmartphoneIcon from "@mui/icons-material/Smartphone";
import { Box, Button, Card, Stack, Tooltip, Typography } from "@mui/material";

import {
  type GeneralMobileLink,
  type IndividualMobileLink,
  type MobileLink,
  partitionMobileLinks,
} from "@repo/contracts/coaching/mobile-link";
import { formatDateParam } from "@repo/shared";

import {
  useLevelPublishAccess,
  useCoachAthletes,
  useMobileLinks,
  useTrainingLevels,
} from "@app/lib/hooks";

import {
  summarizeStripPublishStatus,
  type StripPublishStatus,
} from "../lib/summarize-strip-publish-status";

import { ManageMobileLinksModal } from "./manage-mobile-links-modal";
import { MobileStripPublishStatus } from "./mobile-strip-publish-status";
import { PublishWeekModal } from "./publish-week-modal";

type MobilePublishingStripProps = {
  planId: string;
  monday: Date;
  hasWeekContent: boolean;
};

const PUBLISH_DISABLED_TOOLTIP = "Link a training level or athlete first";
const LEVEL_PUBLISH_FORBIDDEN_TOOLTIP = "Only the head coach can publish to a training level";
const PUBLISH_WEEK_SCOPE_TOOLTIP = "Sends only the week you have open";
const LINKS_ERROR_LABEL = "Couldn't load the publishing status";
const LINKS_ERROR_TOOLTIP = "Can't publish until the publishing status loads";
const NOT_LINKED_LABEL = "Not linked";
const PUBLISHES_TO_PREFIX = "Publishes to: ";
const LEVELS_CLAUSE_LABEL = "Levels: ";
const ATHLETES_CLAUSE_LABEL = "Athletes: ";
const CLAUSE_SEPARATOR = " · ";
const NO_PUBLISH_STATUS: StripPublishStatus = { kind: "none" };
const NO_LINKS: MobileLink[] = [];
const CHECKING_PUBLISH_STATUS: StripPublishStatus = { kind: "checking" };

type ChannelSummary = { clause: string; allResolved: boolean };

const resolvePublishTooltip = (
  hasLinksError: boolean,
  canPublish: boolean,
  hasUnpublishableLevels: boolean,
): string => {
  if (hasLinksError) {
    return LINKS_ERROR_TOOLTIP;
  }

  if (canPublish) {
    return PUBLISH_WEEK_SCOPE_TOOLTIP;
  }

  return hasUnpublishableLevels ? LEVEL_PUBLISH_FORBIDDEN_TOOLTIP : PUBLISH_DISABLED_TOOLTIP;
};

const summarizeChannel = (
  names: (string | undefined)[],
  singular: string,
  plural: string,
): ChannelSummary => {
  if (names.some((name) => name === undefined)) {
    return {
      clause: `${names.length} ${names.length === 1 ? singular : plural}`,
      allResolved: false,
    };
  }

  return { clause: names.join(", "), allResolved: true };
};

const describeLinks = (
  generalLinks: GeneralMobileLink[],
  individualLinks: IndividualMobileLink[],
  levelNameById: Map<number, string>,
  athleteNameById: Map<string, string>,
): string => {
  const hasGeneralLinks = generalLinks.length > 0;
  const hasIndividualLinks = individualLinks.length > 0;

  if (!hasGeneralLinks && !hasIndividualLinks) {
    return NOT_LINKED_LABEL;
  }

  const levels = summarizeChannel(
    generalLinks.map((link) => levelNameById.get(link.legacyLevelId)),
    "level",
    "levels",
  );
  const athletes = summarizeChannel(
    individualLinks.map((link) => athleteNameById.get(link.athleteId)),
    "athlete",
    "athletes",
  );

  if (hasGeneralLinks && hasIndividualLinks) {
    return `${LEVELS_CLAUSE_LABEL}${levels.clause}${CLAUSE_SEPARATOR}${ATHLETES_CLAUSE_LABEL}${athletes.clause}`;
  }

  const summary = hasGeneralLinks ? levels : athletes;

  return summary.allResolved ? `${PUBLISHES_TO_PREFIX}${summary.clause}` : summary.clause;
};

export const MobilePublishingStrip: React.FC<MobilePublishingStripProps> = ({
  planId,
  monday,
  hasWeekContent,
}) => {
  const levelPublishAccess = useLevelPublishAccess();
  const isAccessPending = levelPublishAccess === "pending";
  const weekStart = formatDateParam(monday);
  const linksQuery = useMobileLinks(planId, weekStart);
  const levelsQuery = useTrainingLevels();
  const athletesQuery = useCoachAthletes();

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  const { general: generalLinks, individual: individualLinks } = useMemo(
    () => partitionMobileLinks(linksQuery.data ?? []),
    [linksQuery.data],
  );

  const levelNameById = useMemo(
    () => new Map((levelsQuery.data ?? []).map((level) => [level.id, level.name])),
    [levelsQuery.data],
  );

  const athleteNameById = useMemo(
    () =>
      new Map(
        (athletesQuery.data?.athletes ?? []).map((athlete) => [
          athlete.userId,
          athlete.name ?? athlete.email,
        ]),
      ),
    [athletesQuery.data],
  );

  const hasLinksError = linksQuery.isError;

  const publishStatus = useMemo(() => {
    if (linksQuery.isError) {
      return NO_PUBLISH_STATUS;
    }

    if (linksQuery.isPlaceholderData) {
      return CHECKING_PUBLISH_STATUS;
    }

    return summarizeStripPublishStatus(linksQuery.data ?? [], hasWeekContent);
  }, [hasWeekContent, linksQuery.data, linksQuery.isError, linksQuery.isPlaceholderData]);

  const statusLabel = hasLinksError
    ? LINKS_ERROR_LABEL
    : describeLinks(generalLinks, individualLinks, levelNameById, athleteNameById);
  const publishableLinks = useMemo(() => {
    if (isAccessPending) {
      return NO_LINKS;
    }

    return levelPublishAccess === "allowed" ? (linksQuery.data ?? NO_LINKS) : individualLinks;
  }, [isAccessPending, levelPublishAccess, linksQuery.data, individualLinks]);
  const canPublish = !hasLinksError && publishableLinks.length > 0;
  const hasUnpublishableLevels = levelPublishAccess === "denied" && generalLinks.length > 0;
  const publishTooltip = resolvePublishTooltip(hasLinksError, canPublish, hasUnpublishableLevels);
  const isStripHidden = linksQuery.isPending || isAccessPending;

  return (
    <>
      {!isStripHidden && (
        <Card variant="outlined" sx={{ p: 1.25, px: 1.75 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
              sx={{ minWidth: 0 }}
            >
              <Typography variant="overline" color="text.secondary">
                Mobile publishing
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {statusLabel}
              </Typography>

              <MobileStripPublishStatus status={publishStatus} />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                variant="text"
                startIcon={<SmartphoneIcon />}
                onClick={() => setIsManageOpen(true)}
              >
                Manage
              </Button>

              <Tooltip title={publishTooltip} arrow>
                <Box component="span">
                  <Button
                    variant="contained"
                    disabled={!canPublish}
                    onClick={() => setIsPublishOpen(true)}
                  >
                    Publish this week
                  </Button>
                </Box>
              </Tooltip>
            </Stack>
          </Stack>
        </Card>
      )}

      <ManageMobileLinksModal
        open={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        planId={planId}
        weekStart={weekStart}
      />

      <PublishWeekModal
        open={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        planId={planId}
        monday={monday}
        links={publishableLinks}
        levelNameById={levelNameById}
        athleteNameById={athleteNameById}
      />
    </>
  );
};
