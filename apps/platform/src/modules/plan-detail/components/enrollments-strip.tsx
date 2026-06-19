"use client";

import { useMemo } from "react";

import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { Avatar, AvatarGroup, Box, Button, Card, Stack, Typography } from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";

import { useCoachAthletes, usePlanEnrollments } from "@app/lib/hooks";

const MAX_AVATARS = 6;
const AVATAR_SIZE = 28;
const AVATAR_FONT = 11;
const PAUSED_AVATAR_OPACITY = 0.45;

type EnrollmentsStripProps = {
  planId: string;
  onManage: () => void;
};

export const EnrollmentsStrip: React.FC<EnrollmentsStripProps> = ({ planId, onManage }) => {
  const enrollmentsQuery = usePlanEnrollments(planId);
  const athletesQuery = useCoachAthletes();

  const rosterById = useMemo(() => {
    const map = new Map<string, CoachAthleteListItem>();

    for (const athlete of athletesQuery.data?.athletes ?? []) {
      map.set(athlete.userId, athlete);
    }

    return map;
  }, [athletesQuery.data]);

  const enrollments = enrollmentsQuery.data ?? [];
  const active = enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.ACTIVE);
  const paused = enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.PAUSED);
  const live = active.concat(paused);

  return (
    <Card variant="outlined" sx={{ p: 1.25, px: 1.75 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary">
            Enrolled
          </Typography>

          {enrollmentsQuery.isPending ? null : live.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No athletes enrolled
            </Typography>
          ) : (
            <>
              <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                <AvatarGroup
                  max={MAX_AVATARS}
                  total={live.length}
                  sx={{
                    "& .MuiAvatar-root": {
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      fontSize: AVATAR_FONT,
                    },
                  }}
                >
                  {live.map((enrollment) => {
                    const athlete = rosterById.get(enrollment.athleteId);
                    const label = athlete?.name ?? athlete?.email ?? "?";

                    return (
                      <Avatar
                        key={enrollment.id}
                        {...(athlete?.image && { src: athlete.image })}
                        alt={label}
                        {...(enrollment.status === EnrollmentStatus.PAUSED && {
                          sx: { opacity: PAUSED_AVATAR_OPACITY },
                        })}
                      >
                        {label.charAt(0).toUpperCase()}
                      </Avatar>
                    );
                  })}
                </AvatarGroup>
              </Box>

              <Typography variant="body2" component="span">
                <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
                  {active.length} active
                </Box>
                {paused.length > 0 ? ` · ${paused.length} paused` : null}
              </Typography>
            </>
          )}
        </Stack>

        <Button variant="text" startIcon={<GroupAddIcon />} onClick={onManage}>
          Manage enrollments
        </Button>
      </Stack>
    </Card>
  );
};
