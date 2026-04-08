"use client";

import { Chip, Stack, Typography } from "@mui/material";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coach-athletes";
import { PersonCard, StatusChip } from "@repo/ui";

import { HEALTH_STATUS_CHIPS, PROCESS_STATUS_CHIPS } from "@app/lib/config";

type AthleteListItemProps = {
  athlete: CoachAthleteListItem;
  onSelect: (userId: string) => void;
};

export const AthleteListItem: React.FC<AthleteListItemProps> = ({ athlete, onSelect }) => {
  const plansText =
    athlete.activePlans.length > 0
      ? athlete.activePlans.map((p) => p.name).join(", ")
      : "No active plans";

  return (
    <PersonCard
      image={athlete.image}
      name={athlete.name ?? athlete.email}
      onClick={() => onSelect(athlete.userId)}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
            {athlete.name ?? athlete.email}
          </Typography>
          {athlete.healthStatus !== HealthStatus.HEALTHY && (
            <StatusChip {...HEALTH_STATUS_CHIPS[athlete.healthStatus]} />
          )}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <StatusChip {...PROCESS_STATUS_CHIPS[athlete.processStatus]} />
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
