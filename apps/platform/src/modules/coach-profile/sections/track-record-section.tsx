"use client";

import { Grid } from "@mui/material";

import type { TrackRecord } from "@repo/contracts/coaching/coach-profile";
import { PulseStat, type PulseStatProps } from "@repo/ui";

import { ProfileSection } from "../components";

type TrackRecordSectionProps = {
  trackRecord: TrackRecord;
};

export const TrackRecordSection: React.FC<TrackRecordSectionProps> = ({ trackRecord }) => {
  const stats: PulseStatProps[] = [
    {
      value: trackRecord.monthsActive,
      label: "Months active",
      tooltip: "Whole months since you joined",
      color: "primary",
    },
    {
      value: trackRecord.athletesCoached,
      label: "Athletes coached",
      tooltip: "Athletes currently assigned to you",
      color: "info",
    },
    {
      value: trackRecord.plansAuthored,
      label: "Plans authored",
      tooltip: "Active training plans you've authored",
      color: "success",
    },
  ];

  return (
    <ProfileSection title="Track record" badge={{ label: "DERIVED", color: "default" }}>
      <Grid container>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 4 }}>
            <PulseStat {...stat} />
          </Grid>
        ))}
      </Grid>
    </ProfileSection>
  );
};
