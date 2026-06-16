"use client";

import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { GENDER_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import type { PaletteColorKey } from "@repo/mui";
import { StatusChip } from "@repo/ui";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";

const EMPTY_VALUE = "—";
const HEALTH_NOTE_BG_ALPHA = 0.02;
const HEALTH_NOTE_BORDER_WIDTH_PX = 2;

type HealthPaneProps = {
  detail: CoachAthleteDetail;
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

export const HealthPane: React.FC<HealthPaneProps> = ({ detail }) => (
  <Stack spacing={1.5}>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
      {renderMetricCell("Sex", detail.gender !== null ? GENDER_LABELS[detail.gender] : EMPTY_VALUE)}
      {renderMetricCell(
        "Height",
        detail.heightCm !== null ? `${detail.heightCm}` : EMPTY_VALUE,
        "cm",
      )}
      {renderMetricCell(
        "Weight",
        detail.weightKg !== null ? `${detail.weightKg}` : EMPTY_VALUE,
        "kg",
      )}
    </Box>

    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="overline" sx={{ color: "text.faint" }}>
        Health status
      </Typography>
      <StatusChip {...HEALTH_STATUS_CHIPS[detail.healthStatus]} />
    </Stack>

    {detail.healthNote !== null && detail.healthNote.length > 0 && (
      <Stack
        spacing={0.5}
        sx={(theme) => ({
          p: 1.5,
          borderRadius: theme.spacing(0.5),
          borderLeft: `${HEALTH_NOTE_BORDER_WIDTH_PX}px solid ${theme.palette[HEALTH_NOTE_BORDER_TONE[detail.healthStatus]].main}`,
          bgcolor: alpha(theme.palette.common.white, HEALTH_NOTE_BG_ALPHA),
        })}
      >
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Coach&apos;s note
        </Typography>
        <Typography variant="body2" sx={{ color: "text.primary", whiteSpace: "pre-wrap" }}>
          {detail.healthNote}
        </Typography>
      </Stack>
    )}
  </Stack>
);
