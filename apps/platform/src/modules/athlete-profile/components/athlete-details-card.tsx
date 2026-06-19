"use client";

import { type ReactElement, useEffect, useState } from "react";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";

import {
  ATHLETE_PROFILE_CONSTANTS,
  Gender,
  GENDER_LABELS,
  HealthStatus,
  HEALTH_STATUS_LABELS,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";

import { HealthStatusChip } from "@app/lib/components";

import {
  ATHLETE_DETAILS_EYEBROW,
  CARD_PADDING,
  CARD_RADIUS_PX,
  EYEBROW_LETTER_SPACING,
  EYEBROW_PX,
  FONT_WEIGHT_SEMI_BOLD,
  GENDER_FIELD_LABEL,
  HEALTH_NOTE_FIELD_LABEL,
  HEALTH_STATUS_FIELD_LABEL,
} from "../utils/athlete-profile.constants";

export type AthleteDetailsCardProps = {
  gender: Gender | null;
  healthStatus: HealthStatus;
  healthNote: string | null;
  isSaving: boolean;
  onChange: (patch: UpdateAthleteProfileRequest) => void;
};

export const AthleteDetailsCard = ({
  gender,
  healthStatus,
  healthNote,
  isSaving,
  onChange,
}: AthleteDetailsCardProps): ReactElement => {
  const [noteDraft, setNoteDraft] = useState(healthNote ?? "");

  useEffect(() => {
    setNoteDraft(healthNote ?? "");
  }, [healthNote]);

  const commitNote = (): void => {
    const trimmed = noteDraft.trim();

    if (trimmed !== (healthNote ?? "")) {
      onChange({ healthNote: trimmed || null });
    }
  };

  const handleGenderChange = (value: string): void => {
    const next = Object.values(Gender).find((candidate) => candidate === value);

    if (next !== undefined) {
      onChange({ gender: next });
    }
  };

  const handleStatusChange = (value: string): void => {
    const next = Object.values(HealthStatus).find((candidate) => candidate === value);

    if (next !== undefined) {
      onChange({ healthStatus: next });
    }
  };

  return (
    <Stack
      spacing={1.5}
      sx={(theme) => ({
        p: CARD_PADDING,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${CARD_RADIUS_PX}px`,
      })}
    >
      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(EYEBROW_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: EYEBROW_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.text.secondary,
        })}
      >
        {ATHLETE_DETAILS_EYEBROW}
      </Typography>

      <TextField
        select
        fullWidth
        label={GENDER_FIELD_LABEL}
        value={gender ?? ""}
        disabled={isSaving}
        onChange={(event) => handleGenderChange(event.target.value)}
      >
        <MenuItem value={Gender.MALE}>{GENDER_LABELS[Gender.MALE]}</MenuItem>
        <MenuItem value={Gender.FEMALE}>{GENDER_LABELS[Gender.FEMALE]}</MenuItem>
      </TextField>

      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          select
          fullWidth
          label={HEALTH_STATUS_FIELD_LABEL}
          value={healthStatus}
          disabled={isSaving}
          onChange={(event) => handleStatusChange(event.target.value)}
        >
          {Object.values(HealthStatus).map((status) => (
            <MenuItem key={status} value={status}>
              {HEALTH_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>

        <HealthStatusChip healthStatus={healthStatus} />
      </Stack>

      <TextField
        multiline
        fullWidth
        minRows={2}
        label={HEALTH_NOTE_FIELD_LABEL}
        value={noteDraft}
        disabled={isSaving}
        onChange={(event) => setNoteDraft(event.target.value)}
        onBlur={commitNote}
        inputProps={{ maxLength: ATHLETE_PROFILE_CONSTANTS.MAX_HEALTH_NOTE_LENGTH }}
      />
    </Stack>
  );
};
