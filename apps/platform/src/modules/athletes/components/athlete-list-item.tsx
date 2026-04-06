"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Chip, Stack, Tooltip, Typography } from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coach-athletes";
import { PROCESS_STATUS_LABELS, ProcessStatus } from "@repo/contracts/coach-dashboard";

import { HealthChip, PersonCard } from "@app/lib/components";

type AthleteListItemProps = {
  athlete: CoachAthleteListItem;
};

const PROCESS_STATUS_CONFIG: Record<
  ProcessStatus,
  { icon: React.ReactElement; color: string; tooltip: string }
> = {
  [ProcessStatus.ON_TRACK]: {
    icon: <TrendingUpIcon fontSize="small" />,
    color: "success.main",
    tooltip: "Adherence improving compared to previous week",
  },
  [ProcessStatus.STEADY]: {
    icon: <TrendingFlatIcon fontSize="small" />,
    color: "text.secondary",
    tooltip: "Consistent adherence week over week",
  },
  [ProcessStatus.FALLING_BEHIND]: {
    icon: <TrendingDownIcon fontSize="small" />,
    color: "error.main",
    tooltip: "Adherence declining compared to previous week",
  },
};

export const AthleteListItem: React.FC<AthleteListItemProps> = ({ athlete }) => {
  const statusConfig = PROCESS_STATUS_CONFIG[athlete.processStatus];
  const plansText =
    athlete.activePlans.length > 0
      ? athlete.activePlans.map((p) => p.name).join(", ")
      : "No active plans";

  return (
    <PersonCard
      image={athlete.image}
      name={athlete.name ?? athlete.email}
      href={`/coach/athletes/${athlete.userId}`}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
            {athlete.name ?? athlete.email}
          </Typography>
          <HealthChip healthStatus={athlete.healthStatus} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title={statusConfig.tooltip} arrow>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: "center", color: statusConfig.color }}
            >
              {statusConfig.icon}
              <Typography variant="body2" sx={{ color: "inherit", fontWeight: 500 }}>
                {PROCESS_STATUS_LABELS[athlete.processStatus]}
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>

        <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
          {plansText}
        </Typography>

        {athlete.openActionItemsCount > 0 && (
          <Stack direction="row">
            <Chip
              size="small"
              label={`${athlete.openActionItemsCount} action items`}
              color="warning"
            />
          </Stack>
        )}
      </Stack>
    </PersonCard>
  );
};
