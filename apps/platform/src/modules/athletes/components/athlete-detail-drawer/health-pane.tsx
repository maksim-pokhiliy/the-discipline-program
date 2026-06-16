import { Box, Stack, Typography } from "@mui/material";

import { GENDER_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { StatusChip } from "@repo/ui";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";

const healthNoteColor = (status: HealthStatus): "error" | "warning" | "info" => {
  if (status === HealthStatus.INJURED) {
    return "error";
  }

  if (status === HealthStatus.RESTRICTED) {
    return "warning";
  }

  return "info";
};

type HealthPaneProps = {
  detail: CoachAthleteDetail;
};

export const HealthPane: React.FC<HealthPaneProps> = ({ detail }) => {
  const physicals = [
    { label: "Sex", value: detail.gender ? GENDER_LABELS[detail.gender] : "—" },
    { label: "Height", value: detail.heightCm ? `${detail.heightCm} cm` : "—" },
    { label: "Weight", value: detail.weightKg ? `${detail.weightKg} kg` : "—" },
  ];

  return (
    <Stack spacing={1.5} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1}>
        {physicals.map((item) => (
          <Box
            key={item.label}
            sx={(theme) => ({
              flex: 1,
              p: 1.25,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.default",
            })}
          >
            <Typography variant="overline" color="text.muted" display="block">
              {item.label}
            </Typography>
            <Typography variant="subtitle2">{item.value}</Typography>
          </Box>
        ))}
      </Stack>

      <Box>
        <Typography variant="overline" color="text.muted" display="block" sx={{ mb: 0.5 }}>
          Health status
        </Typography>
        <StatusChip {...HEALTH_STATUS_CHIPS[detail.healthStatus]} />
      </Box>

      {detail.healthNote && (
        <Box>
          <Typography variant="overline" color="text.muted" display="block" sx={{ mb: 0.5 }}>
            Coach&apos;s health note
          </Typography>
          <Typography
            variant="body2"
            sx={(theme) => ({
              pl: 1,
              borderLeft: `2px solid ${theme.palette[healthNoteColor(detail.healthStatus)].main}`,
            })}
          >
            {detail.healthNote}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};
