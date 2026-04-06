"use client";

import { Chip, type ChipProps, Stack, Typography } from "@mui/material";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import {
  PLAN_ENROLLMENT_STATUS_LABELS,
  PlanEnrollmentStatus,
} from "@repo/contracts/plan-enrollment";

import { PersonCard, StatusChip } from "@app/lib/components";
import { HEALTH_STATUS_CHIPS } from "@app/lib/config";

import { EnrollmentActionMenu } from "./enrollment-action-menu";

const STATUS_COLORS: Record<PlanEnrollmentStatus, ChipProps["color"]> = {
  [PlanEnrollmentStatus.ACTIVE]: "success",
  [PlanEnrollmentStatus.PAUSED]: "warning",
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
            color={STATUS_COLORS[enrollment.status]}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Enrolled {formatDate(enrollment.startDate)}
          </Typography>
        </Stack>
      </Stack>
    </PersonCard>
  );
};
