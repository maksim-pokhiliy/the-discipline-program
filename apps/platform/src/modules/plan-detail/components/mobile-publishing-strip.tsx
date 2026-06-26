"use client";

import { useMemo, useState } from "react";

import SmartphoneIcon from "@mui/icons-material/Smartphone";
import { Box, Button, Card, Stack, Tooltip, Typography } from "@mui/material";

import type { MobileLink } from "@repo/contracts/coaching/mobile-link";

import { useMobileConnections, useMobileLinks, useTrainingLevels } from "@app/lib/hooks";

import { ManageMobileLinksModal } from "./manage-mobile-links-modal";
import { PublishWeekModal } from "./publish-week-modal";

type MobilePublishingStripProps = {
  planId: string;
  monday: Date;
};

const PUBLISH_DISABLED_TOOLTIP = "Link a training level first";
const NOT_LINKED_LABEL = "Not linked";

const describeLinks = (links: MobileLink[], levelNameById: Map<number, string>): string => {
  if (links.length === 0) {
    return NOT_LINKED_LABEL;
  }

  const names = links.map((link) =>
    link.legacyLevelId === null ? undefined : levelNameById.get(link.legacyLevelId),
  );

  if (names.some((name) => name === undefined)) {
    return `${links.length} ${links.length === 1 ? "level" : "levels"}`;
  }

  return `Publishes to: ${names.join(", ")}`;
};

export const MobilePublishingStrip: React.FC<MobilePublishingStripProps> = ({ planId, monday }) => {
  const connectionsQuery = useMobileConnections();
  const isConnected = (connectionsQuery.data ?? []).length > 0;

  const linksQuery = useMobileLinks(planId);
  const levelsQuery = useTrainingLevels(isConnected);

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  const links = useMemo<MobileLink[]>(
    () => (linksQuery.data ?? []).filter((link) => link.channel === "GENERAL"),
    [linksQuery.data],
  );

  const levelNameById = useMemo(
    () => new Map((levelsQuery.data ?? []).map((level) => [level.id, level.name])),
    [levelsQuery.data],
  );

  if (connectionsQuery.isPending || linksQuery.isPending) {
    return null;
  }

  const statusLabel = describeLinks(links, levelNameById);
  const hasLinks = links.length > 0;

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
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Mobile publishing
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {statusLabel}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Button
              variant="text"
              startIcon={<SmartphoneIcon />}
              onClick={() => setIsManageOpen(true)}
            >
              Manage
            </Button>

            <Tooltip title={hasLinks ? "" : PUBLISH_DISABLED_TOOLTIP} arrow>
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
      />

      <PublishWeekModal
        open={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        monday={monday}
        links={links}
        levelNameById={levelNameById}
      />
    </>
  );
};
