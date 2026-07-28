"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { IconButton, Stack, Typography } from "@mui/material";

import { type GeneralMobileLink } from "@repo/contracts/coaching/mobile-link";

import { MobileLinkPublishStatus } from "./mobile-link-publish-status";

const UNLINK_ARIA = "Unlink training level";
const SINGLE_LINK_COUNT = 1;

type GeneralLinkRowProps = {
  link: GeneralMobileLink;
  label: string;
  onUnlink: () => void;
};

export const GeneralLinkRow: React.FC<GeneralLinkRowProps> = ({ link, label, onUnlink }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={1.5}
    sx={{ px: 1.5, py: 1 }}
  >
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
      <Typography variant="body2">{label}</Typography>

      <MobileLinkPublishStatus
        neverPublishedCount={link.publishedDayCount === 0 ? SINGLE_LINK_COUNT : 0}
        totalCount={SINGLE_LINK_COUNT}
        lastPublishedAt={link.lastPublishedAt}
      />
    </Stack>

    <IconButton aria-label={UNLINK_ARIA} size="small" onClick={onUnlink}>
      <DeleteOutlineIcon fontSize="small" />
    </IconButton>
  </Stack>
);
