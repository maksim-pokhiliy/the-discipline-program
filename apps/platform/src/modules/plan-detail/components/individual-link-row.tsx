"use client";

import { useState } from "react";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";

import type { IndividualMobileLink } from "@repo/contracts/coaching/mobile-link";
import { ConfirmationModal, UserChip } from "@repo/ui";

import { MobileLinkPublishStatus } from "./mobile-link-publish-status";

const LINK_LABEL = "Link";
const NO_ACCOUNT_CAPTION = "No Individual-plan account in the mobile app";
const UNLINK_ARIA = "Unlink mobile athlete";
const UNLINK_TITLE = "Unlink mobile athlete?";
const UNLINK_CONFIRM_TEXT = "Unlink";

type IndividualLinkRowProps = {
  displayName: string;
  image?: string | null;
  athleteId: string;
  existingLink?: IndividualMobileLink;
  canLink: boolean;
  onLink: () => void;
  onUnlink: () => void;
  isMutating: boolean;
};

export const IndividualLinkRow: React.FC<IndividualLinkRowProps> = ({
  displayName,
  image,
  athleteId,
  existingLink,
  canLink,
  onLink,
  onUnlink,
  isMutating,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const user = { id: athleteId, name: displayName, image: image ?? null };

  const handleUnlinkConfirm = (): void => {
    onUnlink();
    setIsConfirmOpen(false);
  };

  if (existingLink === undefined) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <UserChip user={user} />
        </Box>

        {canLink ? (
          <Button variant="outlined" size="small" disabled={isMutating} onClick={onLink}>
            {LINK_LABEL}
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {NO_ACCOUNT_CAPTION}
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ minWidth: 0 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <UserChip user={user} />
        </Box>

        <MobileLinkPublishStatus
          publishedDayCount={existingLink.publishedDayCount}
          lastPublishedAt={existingLink.lastPublishedAt}
        />
      </Stack>

      <IconButton
        aria-label={UNLINK_ARIA}
        size="small"
        disabled={isMutating}
        onClick={() => setIsConfirmOpen(true)}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>

      <ConfirmationModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        type="danger"
        title={UNLINK_TITLE}
        confirmText={UNLINK_CONFIRM_TEXT}
        message={`Stop publishing this plan to ${displayName}?`}
        isConfirming={isMutating}
        onConfirm={handleUnlinkConfirm}
      />
    </Stack>
  );
};
