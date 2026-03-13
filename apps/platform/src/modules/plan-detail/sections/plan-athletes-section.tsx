"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Fab, Stack, Typography } from "@mui/material";

import { type PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { QueryWrapper } from "@repo/query";

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

  const isEnrollmentPending = (id: string) =>
    (updateEnrollment.isPending && updateEnrollment.variables?.id === id) ||
    (deleteEnrollment.isPending && deleteEnrollment.variables === id);

  const handleUpdate = (id: string, status: PlanEnrollmentStatus) => {
    updateEnrollment.mutate({ id, data: { status } });
  };

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
            <Stack spacing={1}>
              {data.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onUpdate={handleUpdate}
                  onDelete={(id) => deleteEnrollment.mutate(id)}
                  isPending={isEnrollmentPending(enrollment.id)}
                />
              ))}
            </Stack>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
            >
              No athletes enrolled yet
            </Typography>
          )
        }
      </QueryWrapper>

      <Fab
        color="primary"
        onClick={() => setEnrollOpen(true)}
        sx={{ position: "fixed", bottom: 100, right: 16 }}
      >
        <AddIcon />
      </Fab>

      <EnrollAthleteDialog
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        planId={planId}
        enrollments={enrollments ?? []}
      />
    </Stack>
  );
};
