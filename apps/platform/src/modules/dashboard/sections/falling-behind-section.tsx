"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { Avatar, Box, Stack, Typography } from "@mui/material";

import type { ProgressAthlete, ProgressBuckets } from "@repo/contracts/coaching/coach-dashboard";
import { rateToPercent } from "@repo/shared";
import { RosterList, RosterRow, SectionHead } from "@repo/ui";

const TITLE = "Falling behind";
const FALLING_BEHIND_LIMIT = 4;
const AVATAR_SIZE = 4;
const DOT = "·";

type FallingBehindSectionProps = {
  buckets: ProgressBuckets;
  onOpenAthlete: (athleteId: string) => void;
};

const buildSub = (athlete: ProgressAthlete): React.ReactNode => (
  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
    {athlete.engagementPct !== null && athlete.engagementPct !== undefined && (
      <Box component="span">
        Engagement{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          {athlete.engagementPct}%
        </Box>
      </Box>
    )}
    {athlete.weeklyDelta !== null && athlete.weeklyDelta !== undefined && (
      <>
        <Box component="span">{DOT}</Box>
        <Box component="span">wk Δ {athlete.weeklyDelta}%</Box>
      </>
    )}
  </Stack>
);

export const FallingBehindSection: React.FC<FallingBehindSectionProps> = ({
  buckets,
  onOpenAthlete,
}) => {
  if (buckets.fallingBehind.length === 0) {
    return null;
  }

  const rows = buckets.fallingBehind.slice(0, FALLING_BEHIND_LIMIT);

  return (
    <Stack spacing={1}>
      <SectionHead
        title={TITLE}
        count={buckets.fallingBehind.length}
        countTone="error"
        meta={`avg ${rateToPercent(buckets.avgEngagementRate)}% engagement`}
      />

      <RosterList>
        {rows.map((athlete) => (
          <RosterRow
            key={athlete.userId}
            onClick={() => onOpenAthlete(athlete.userId)}
            leading={
              <Avatar
                {...(athlete.image !== null && { src: athlete.image })}
                alt={athlete.name ?? ""}
                sx={(theme) => ({
                  width: theme.spacing(AVATAR_SIZE),
                  height: theme.spacing(AVATAR_SIZE),
                })}
              >
                {(athlete.name ?? "?").charAt(0).toUpperCase()}
              </Avatar>
            }
            name={athlete.name ?? "Unknown"}
            sub={buildSub(athlete)}
            trailing={
              athlete.weeklyDelta !== null && athlete.weeklyDelta !== undefined ? (
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ color: "error.main" }}
                >
                  <TrendingDownIcon fontSize="small" />
                  <Typography component="span" variant="body2">
                    {athlete.weeklyDelta}%
                  </Typography>
                </Stack>
              ) : undefined
            }
          />
        ))}
      </RosterList>
    </Stack>
  );
};
