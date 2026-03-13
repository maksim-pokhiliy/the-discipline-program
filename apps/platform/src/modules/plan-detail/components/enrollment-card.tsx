"use client";

import { Avatar, Chip, type ChipProps, Paper, Stack, Typography } from "@mui/material";

import type { PlanEnrollment } from "@repo/contracts/plan-enrollment";
import {
  PLAN_ENROLLMENT_STATUS_LABELS,
  PlanEnrollmentStatus,
} from "@repo/contracts/plan-enrollment";

import { EnrollmentActionMenu } from "./enrollment-action-menu";

const STATUS_COLORS: Record<PlanEnrollmentStatus, ChipProps["color"]> = {
  [PlanEnrollmentStatus.ACTIVE]: "success",
  [PlanEnrollmentStatus.PAUSED]: "warning",
  [PlanEnrollmentStatus.COMPLETED]: "default",
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar
          src={enrollment.user.image ?? undefined}
          alt={displayName}
          sx={{ width: 36, height: 36, fontSize: 14 }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>

        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {displayName}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip
              size="small"
              label={PLAN_ENROLLMENT_STATUS_LABELS[enrollment.status]}
              color={STATUS_COLORS[enrollment.status]}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Since {formatDate(enrollment.startDate)}
            </Typography>
          </Stack>
        </Stack>

        <EnrollmentActionMenu
          enrollmentId={enrollment.id}
          status={enrollment.status}
          athleteName={displayName}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isPending={isPending}
        />
      </Stack>
    </Paper>
  );
};
