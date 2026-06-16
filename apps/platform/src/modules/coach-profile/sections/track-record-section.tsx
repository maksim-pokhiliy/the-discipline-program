import { Chip, Stack, Typography } from "@mui/material";

import type { ActiveDuration, TrackRecord } from "@repo/contracts/coaching/coach-profile";

import {
  ProfileSection,
  TrackRecordBand,
  type TrackRecordSegment,
  type TrackRecordStat,
} from "../components";

const DURATION_UNITS: ReadonlyArray<{ unit: keyof ActiveDuration; suffix: string }> = [
  { unit: "years", suffix: "y" },
  { unit: "months", suffix: "mo" },
  { unit: "days", suffix: "d" },
];

const buildActiveSegments = (duration: ActiveDuration): TrackRecordSegment[] => {
  const segments = DURATION_UNITS.filter(({ unit }) => duration[unit] > 0).map(
    ({ unit, suffix }) => ({
      value: duration[unit],
      unit: suffix,
    }),
  );

  return segments.length > 0 ? segments : [{ value: 0, unit: "d" }];
};

type TrackRecordSectionProps = {
  trackRecord: TrackRecord;
};

export const TrackRecordSection: React.FC<TrackRecordSectionProps> = ({ trackRecord }) => {
  const stats: TrackRecordStat[] = [
    { segments: buildActiveSegments(trackRecord.activeDuration), label: "Time active" },
    { segments: [{ value: trackRecord.athletesCoached }], label: "Athletes coached", accent: true },
    { segments: [{ value: trackRecord.plansAuthored }], label: "Plans authored" },
  ];

  return (
    <ProfileSection
      title="Your track record"
      meta="Lifetime"
      subline={
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ px: 0.25 }}>
          <Chip variant="indicator" color="info" label="Derived" />

          <Typography variant="caption" color="text.muted">
            Aggregated from your work in the platform.
          </Typography>
        </Stack>
      }
    >
      <TrackRecordBand stats={stats} />
    </ProfileSection>
  );
};
