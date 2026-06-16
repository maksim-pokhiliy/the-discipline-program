import { Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { CoachAthleteEnrollment } from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus } from "@repo/contracts/lms";

import { formatRelativeTime } from "../athletes-roster-config";

type PlanPaneProps = {
  enrollments: CoachAthleteEnrollment[];
};

export const PlanPane: React.FC<PlanPaneProps> = ({ enrollments }) => {
  if (enrollments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No active plan enrollment.
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      {enrollments.map((enrollment) => {
        const paused = enrollment.status === EnrollmentStatus.PAUSED;

        return (
          <Box
            key={enrollment.planId}
            component={Link}
            href={`/coach/plans/${enrollment.planId}`}
            sx={(theme) => ({
              display: "block",
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.default",
              color: "inherit",
              textDecoration: "none",
              transition: theme.transitions.create("border-color"),
              "&:hover": { borderColor: theme.palette.primary.main },
            })}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {enrollment.planName}
              </Typography>
              <Chip
                size="small"
                label={paused ? "Paused" : "Active"}
                color={paused ? "warning" : "success"}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Boarded {formatRelativeTime(enrollment.boardedAt)}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
};
