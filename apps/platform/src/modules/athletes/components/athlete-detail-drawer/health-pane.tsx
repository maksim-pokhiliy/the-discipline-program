"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { GENDER_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { AthleteProfile } from "@repo/contracts/coaching/athlete-profile";
import type { PaletteColorKey } from "@repo/mui";
import { StatusChip } from "@repo/ui";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";
import { useCoachAthleteProfile } from "@app/lib/hooks";

const EMPTY_VALUE = "—";
const HEALTH_NOTE_BG_ALPHA = 0.02;
const HEALTH_NOTE_BORDER_WIDTH_PX = 2;

type HealthPaneProps = {
  athleteId: string;
};

const HEALTH_NOTE_BORDER_TONE: Record<HealthStatus, PaletteColorKey> = {
  [HealthStatus.HEALTHY]: "success",
  [HealthStatus.INJURED]: "error",
  [HealthStatus.RESTRICTED]: "warning",
};

const renderMetricCell = (label: string, value: string, unit?: string): React.ReactNode => (
  <Stack
    spacing={0.5}
    sx={(theme) => ({
      p: 1,
      borderRadius: theme.spacing(0.5),
      border: `1px solid ${theme.palette.divider}`,
      bgcolor: theme.palette.background.paper,
      minWidth: 0,
    })}
  >
    <Typography variant="overline" sx={{ color: "text.faint" }}>
      {label}
    </Typography>
    <Typography variant="h5" sx={{ color: "text.primary" }}>
      {value}
      {unit !== undefined && value !== EMPTY_VALUE && (
        <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.25 }}>
          {unit}
        </Typography>
      )}
    </Typography>
  </Stack>
);

const renderProfile = (profile: AthleteProfile): React.ReactElement => (
  <Stack spacing={1.5}>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
      {renderMetricCell(
        "Sex",
        profile.gender !== null ? GENDER_LABELS[profile.gender] : EMPTY_VALUE,
      )}
      {renderMetricCell(
        "Height",
        profile.heightCm !== null ? `${profile.heightCm}` : EMPTY_VALUE,
        "cm",
      )}
      {renderMetricCell(
        "Weight",
        profile.weightKg !== null ? `${profile.weightKg}` : EMPTY_VALUE,
        "kg",
      )}
    </Box>

    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="overline" sx={{ color: "text.faint" }}>
        Health status
      </Typography>
      <StatusChip {...HEALTH_STATUS_CHIPS[profile.healthStatus]} />
    </Stack>

    {profile.healthNote !== null && profile.healthNote.length > 0 && (
      <Stack
        spacing={0.5}
        sx={(theme) => ({
          p: 1.5,
          borderRadius: theme.spacing(0.5),
          borderLeft: `${HEALTH_NOTE_BORDER_WIDTH_PX}px solid ${theme.palette[HEALTH_NOTE_BORDER_TONE[profile.healthStatus]].main}`,
          bgcolor: alpha(theme.palette.common.white, HEALTH_NOTE_BG_ALPHA),
        })}
      >
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Coach&apos;s note
        </Typography>
        <Typography variant="body2" sx={{ color: "text.primary", whiteSpace: "pre-wrap" }}>
          {profile.healthNote}
        </Typography>
      </Stack>
    )}
  </Stack>
);

export const HealthPane: React.FC<HealthPaneProps> = ({ athleteId }) => {
  const { data: profile, isLoading } = useCoachAthleteProfile(athleteId);

  return (
    <Stack spacing={1}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Profile
      </Typography>

      {isLoading || !profile ? (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={24} />
        </Stack>
      ) : (
        renderProfile(profile)
      )}
    </Stack>
  );
};
