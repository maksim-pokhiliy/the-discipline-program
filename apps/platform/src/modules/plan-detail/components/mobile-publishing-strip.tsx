"use client";

import { useMemo, useState } from "react";

import SmartphoneIcon from "@mui/icons-material/Smartphone";
import { Box, Button, Card, Stack, Tooltip, Typography } from "@mui/material";

import {
  type GeneralMobileLink,
  type IndividualMobileLink,
  partitionMobileLinks,
} from "@repo/contracts/coaching/mobile-link";
import { formatDateParam } from "@repo/shared";

import {
  useCoachAthletes,
  useMobileConnections,
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
};

const PUBLISH_DISABLED_TOOLTIP = "Link a training level or athlete first";
const PUBLISH_WEEK_SCOPE_TOOLTIP = "Sends only the week you have open";
const NOT_LINKED_LABEL = "Not linked";
const PUBLISHES_TO_PREFIX = "Publishes to: ";
const LEVELS_CLAUSE_LABEL = "Levels: ";
const ATHLETES_CLAUSE_LABEL = "Athletes: ";
const CLAUSE_SEPARATOR = " · ";
const NO_PUBLISH_STATUS: StripPublishStatus = { kind: "none" };

type ChannelSummary = { clause: string; allResolved: boolean };

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

export const MobilePublishingStrip: React.FC<MobilePublishingStripProps> = ({ planId, monday }) => {
  const connectionsQuery = useMobileConnections();
  const isConnected = (connectionsQuery.data ?? []).length > 0;

  const weekStart = formatDateParam(monday);
  const linksQuery = useMobileLinks(planId, weekStart);
  const levelsQuery = useTrainingLevels(isConnected);
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

  const publishStatus = useMemo(
    () =>
      linksQuery.isPlaceholderData
        ? NO_PUBLISH_STATUS
        : summarizeStripPublishStatus(linksQuery.data ?? []),
    [linksQuery.data, linksQuery.isPlaceholderData],
  );

  if (connectionsQuery.isPending || linksQuery.isPending) {
    return null;
  }

  const statusLabel = describeLinks(generalLinks, individualLinks, levelNameById, athleteNameById);
  const hasLinks = generalLinks.length + individualLinks.length > 0;

  return (
    <>
      <Card variant="outlined" sx={{ p: 1.25, px: 1.75 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          flexWrap="wrap"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            flexWrap="wrap"
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

            <Tooltip title={hasLinks ? PUBLISH_WEEK_SCOPE_TOOLTIP : PUBLISH_DISABLED_TOOLTIP} arrow>
              <Box component="span">
                <Button
                  variant="contained"
                  disabled={!hasLinks}
                  onClick={() => setIsPublishOpen(true)}
                >
                  Publish this week
                </Button>
              </Box>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>

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
        links={linksQuery.data ?? []}
        levelNameById={levelNameById}
        athleteNameById={athleteNameById}
      />
    </>
  );
};
