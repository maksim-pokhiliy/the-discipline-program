"use client";

import { Chip, Stack, Typography } from "@mui/material";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import {
  PLAN_ENROLLMENT_STATUS_LABELS,
  type PlanEnrollmentStatus,
} from "@repo/contracts/plan-enrollment";

import { PersonCard, StatusChip } from "@app/lib/components";
import { HEALTH_STATUS_CHIPS } from "@app/lib/config";
import { ENROLLMENT_STATUS_COLORS } from "@app/lib/config/enrollment-status";
import { formatShortDate } from "@app/lib/utils/date-formatters";

import { EnrollmentActionMenu } from "./enrollment-action-menu";

type EnrollmentCardProps = {
  enrollment: PlanEnrollment;
  onUpdate: (id: string, status: PlanEnrollmentStatus) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
};

export const EnrollmentCard: React.FC<EnrollmentCardProps> = ({
  enrollment,
  onUpdate,
  onDelete,
  isPending,
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
            isPending={isPending}
          />
        </Stack>
      }
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
            {displayName}
          </Typography>
          {enrollment.user.healthStatus !== HealthStatus.HEALTHY && (
            <StatusChip {...HEALTH_STATUS_CHIPS[enrollment.user.healthStatus]} />
          )}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            size="small"
            label={PLAN_ENROLLMENT_STATUS_LABELS[enrollment.status]}
            color={ENROLLMENT_STATUS_COLORS[enrollment.status]}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Enrolled {formatShortDate(enrollment.startDate)}
          </Typography>
        </Stack>
      </Stack>
    </PersonCard>
  );
};
