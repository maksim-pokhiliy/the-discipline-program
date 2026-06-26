"use client";

import { useState } from "react";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import type { MobileAthlete } from "@repo/contracts/coaching/legacy-mobile";
import type { IndividualMobileLink } from "@repo/contracts/coaching/mobile-link";
import { ConfirmationModal, UserChip } from "@repo/ui";

import { formatMobileAthleteName } from "@app/lib/format-mobile-athlete-name";

const LINK_LABEL = "Link mobile athlete";
const UNLINK_ARIA = "Unlink mobile athlete";
const UNLINK_TITLE = "Unlink mobile athlete?";
const UNLINK_CONFIRM_TEXT = "Unlink";
const MOBILE_PREFIX = "Mobile: ";
const USERNAME_PREFIX = " · @";
const NO_SELECTION = "";

type IndividualLinkRowProps = {
  displayName: string;
  image?: string | null;
  athleteId: string;
  existingLink?: IndividualMobileLink;
  legacyOptions: MobileAthlete[];
  legacyAthleteById: Map<number, MobileAthlete>;
  onLink: (legacyUserId: number) => void;
  onUnlink: () => void;
  isMutating: boolean;
};

const describeLegacyAthlete = (athlete: MobileAthlete): string =>
  `${formatMobileAthleteName(athlete)}${USERNAME_PREFIX}${athlete.username}`;

export const IndividualLinkRow: React.FC<IndividualLinkRowProps> = ({
  displayName,
  image,
  athleteId,
  existingLink,
  legacyOptions,
  legacyAthleteById,
  onLink,
  onUnlink,
  isMutating,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const resolvedImage = image ?? null;

  const handleSelect = (value: string): void => {
    if (value === NO_SELECTION) {
      return;
    }

    const legacyUserId = Number(value);

    if (!Number.isInteger(legacyUserId)) {
      return;
    }

    onLink(legacyUserId);
  };

  const handleUnlinkConfirm = (): void => {
    onUnlink();
    setIsConfirmOpen(false);
  };

  if (existingLink === undefined) {
    const labelId = `link-mobile-athlete-${athleteId}`;

    return (
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box sx={{ minWidth: 0, flexShrink: 0 }}>
          <UserChip user={{ id: athleteId, name: displayName, image: resolvedImage }} />
        </Box>

        <FormControl size="small" disabled={isMutating} sx={{ flexGrow: 1, minWidth: 0 }}>
          <InputLabel id={labelId}>{LINK_LABEL}</InputLabel>

          <Select
            labelId={labelId}
            label={LINK_LABEL}
            value={NO_SELECTION}
            onChange={(event) => handleSelect(event.target.value)}
          >
            {legacyOptions.map((athlete) => (
              <MenuItem key={athlete.id} value={String(athlete.id)}>
                {describeLegacyAthlete(athlete)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    );
  }

  const linkedLegacy = legacyAthleteById.get(existingLink.legacyUserId);
  const linkedLabel = linkedLegacy
    ? describeLegacyAthlete(linkedLegacy)
    : `#${existingLink.legacyUserId}`;

  const secondary = (
    <Typography variant="caption" color="text.secondary">
      {MOBILE_PREFIX}
      {linkedLabel}
    </Typography>
  );

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ minWidth: 0 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <UserChip
          user={{ id: athleteId, name: displayName, image: resolvedImage }}
          secondary={secondary}
        />
      </Box>

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
        message={`Stop publishing this plan to ${linkedLabel}?`}
        isConfirming={isMutating}
        onConfirm={handleUnlinkConfirm}
      />
    </Stack>
  );
};
