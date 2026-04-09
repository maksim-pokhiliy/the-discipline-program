"use client";

import { Chip, Stack, Typography } from "@mui/material";

import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import {
  PLAN_ENROLLMENT_STATUS_LABELS,
  type PlanEnrollmentStatus,
} from "@repo/contracts/plan-enrollment";
import { formatDate } from "@repo/shared";
import { PersonCard } from "@repo/ui";

import { HealthStatusChip } from "@app/lib/components";
import { ENROLLMENT_STATUS_COLORS } from "@app/lib/config";

import { EnrollmentActionMenu } from "./enrollment-action-menu";

type EnrollmentCardProps = {
  enrollment: PlanEnrollment;
  onUpdate: (id: string, status: PlanEnrollmentStatus) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
};

export const EnrollmentCard: React.FC<EnrollmentCardProps> = ({
  enrollment,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  const displayName = enrollment.user.name ?? enrollment.user.email;

  return (
    <PersonCard
      image={enrollment.user.image}
      name={displayName}
      action={
        <Stack sx={{ pt: 1, pr: 1 }}>
          <EnrollmentActionMenu
            enrollmentId={enrollment.id}
            status={enrollment.status}
            athleteName={displayName}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        </Stack>
      }
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
            {displayName}
          </Typography>
          <HealthStatusChip healthStatus={enrollment.user.healthStatus} />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={PLAN_ENROLLMENT_STATUS_LABELS[enrollment.status]}
            color={ENROLLMENT_STATUS_COLORS[enrollment.status]}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Enrolled {formatDate(enrollment.startDate, "day")}
          </Typography>
        </Stack>
      </Stack>
    </PersonCard>
  );
};
