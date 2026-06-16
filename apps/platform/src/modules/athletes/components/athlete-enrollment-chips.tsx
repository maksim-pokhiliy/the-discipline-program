"use client";

import PauseIcon from "@mui/icons-material/Pause";
import { Chip, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import type { CoachAthleteEnrollment } from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus } from "@repo/contracts/lms";

const MAX_VISIBLE_ENROLLMENTS = 2;
const ENROLLMENT_CHIP_MAX_WIDTH = 200;

const planHref = (planId: string) => `/coach/plans/${planId}`;

type AthleteEnrollmentChipsProps = {
  enrollments: CoachAthleteEnrollment[];
};

export const AthleteEnrollmentChips: React.FC<AthleteEnrollmentChipsProps> = ({ enrollments }) => {
  if (enrollments.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: "text.muted", fontStyle: "italic" }}>
        No active plan
      </Typography>
    );
  }

  const visible = enrollments.slice(0, MAX_VISIBLE_ENROLLMENTS);
  const overflow = enrollments.slice(MAX_VISIBLE_ENROLLMENTS);

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
      {visible.map((enrollment) => {
        const paused = enrollment.status === EnrollmentStatus.PAUSED;

        return (
          <Chip
            key={enrollment.planId}
            component={Link}
            href={planHref(enrollment.planId)}
            clickable
            onClick={(event) => event.stopPropagation()}
            size="small"
            variant={paused ? "filled" : "outlined"}
            label={enrollment.planName}
            {...(paused && { color: "warning" as const, icon: <PauseIcon /> })}
            sx={{ maxWidth: ENROLLMENT_CHIP_MAX_WIDTH }}
          />
        );
      })}

      {overflow.length > 0 && (
        <Tooltip
          title={
            <Stack spacing={0.25}>
              {overflow.map((enrollment) => (
                <Typography key={enrollment.planId} variant="caption" sx={{ color: "inherit" }}>
                  {enrollment.planName}
                  {enrollment.status === EnrollmentStatus.PAUSED ? " · paused" : ""}
                </Typography>
              ))}
            </Stack>
          }
        >
          <Chip size="small" variant="outlined" label={`+${overflow.length}`} />
        </Tooltip>
      )}
    </Stack>
  );
};
