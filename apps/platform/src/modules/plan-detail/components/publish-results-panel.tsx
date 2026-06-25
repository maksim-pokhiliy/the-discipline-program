"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";

import type { PublishDayResult } from "@repo/contracts/coaching/mobile-publish";
import { DEFAULT_LOCALE } from "@repo/shared";
import { StatusChip } from "@repo/ui";

import { PUBLISH_RESULT_CHIPS } from "@app/lib/config";

export type PublishLevelGroup = {
  levelName: string;
  outcome:
    | { kind: "results"; results: PublishDayResult[] }
    | { kind: "reconnect" }
    | { kind: "error"; message: string };
};

type PublishResultsPanelProps = {
  groups: PublishLevelGroup[];
  onReconnect?: () => void;
};

const RECONNECT_MESSAGE = "Connection expired — reconnect to publish.";

const formatResultDayLabel = (scheduledDate: string): string =>
  new Date(`${scheduledDate}T00:00:00Z`).toLocaleDateString(DEFAULT_LOCALE, {
    weekday: "short",
    timeZone: "UTC",
  });

export const PublishResultsPanel: React.FC<PublishResultsPanelProps> = ({
  groups,
  onReconnect,
}) => (
  <Stack spacing={2.5}>
    {groups.map((group) => (
      <Stack key={group.levelName} spacing={1}>
        <Typography variant="overline" color="text.secondary">
          {group.levelName}
        </Typography>

        {group.outcome.kind === "results" ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {group.outcome.results.map((result) => (
              <Stack key={result.scheduledDate} direction="row" spacing={0.75} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {formatResultDayLabel(result.scheduledDate)}
                </Typography>

                <StatusChip {...PUBLISH_RESULT_CHIPS[result.action]} />
              </Stack>
            ))}
          </Stack>
        ) : group.outcome.kind === "reconnect" ? (
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              {RECONNECT_MESSAGE}
            </Typography>

            {onReconnect !== undefined && (
              <Button variant="text" size="small" onClick={onReconnect}>
                Reconnect
              </Button>
            )}
          </Stack>
        ) : (
          <Alert severity="error">{group.outcome.message}</Alert>
        )}
      </Stack>
    ))}
  </Stack>
);
