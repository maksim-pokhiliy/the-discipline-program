"use client";

import { useCallback, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Stack, Typography } from "@mui/material";

import { type PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { QueryWrapper } from "@repo/ui";

import { PlatformFab } from "@app/lib/components";
import {
  useDeletePlanEnrollment,
  usePlanEnrollments,
  useUpdatePlanEnrollment,
} from "@app/lib/hooks";

import { EnrollAthleteDialog, EnrollmentCard } from "../components";

type PlanAthletesSectionProps = {
  planId: string;
};

export const PlanAthletesSection: React.FC<PlanAthletesSectionProps> = ({ planId }) => {
  const { data: enrollments, isLoading, error } = usePlanEnrollments(planId);
  const updateEnrollment = useUpdatePlanEnrollment(planId);
  const deleteEnrollment = useDeletePlanEnrollment(planId);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const isUpdating = useCallback(
    (id: string) => updateEnrollment.isPending && updateEnrollment.variables?.id === id,
    [updateEnrollment],
  );

  const isDeleting = useCallback(
    (id: string) => deleteEnrollment.isPending && deleteEnrollment.variables === id,
    [deleteEnrollment],
  );

  const handleUpdate = useCallback(
    (id: string, status: PlanEnrollmentStatus) => {
      updateEnrollment.mutate({ id, data: { status } });
    },
    [updateEnrollment],
  );

  return (
    <Stack spacing={2}>
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={enrollments}
        loadingMessage="Loading athletes..."
      >
        {(data) =>
          data.length > 0 ? (
            <Grid container spacing={2}>
              {data.map((enrollment) => (
                <Grid key={enrollment.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <EnrollmentCard
                    enrollment={enrollment}
                    onUpdate={handleUpdate}
                    onDelete={(id) => deleteEnrollment.mutate(id)}
                    isUpdating={isUpdating(enrollment.id)}
                    isDeleting={isDeleting(enrollment.id)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No athletes enrolled yet
              </Typography>

              <Button startIcon={<AddIcon />} onClick={() => setEnrollOpen(true)}>
                Enroll Athlete
              </Button>
            </Stack>
          )
        }
      </QueryWrapper>

      <PlatformFab onClick={() => setEnrollOpen(true)} />

      <EnrollAthleteDialog
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        planId={planId}
        enrollments={enrollments ?? []}
      />
    </Stack>
  );
};
