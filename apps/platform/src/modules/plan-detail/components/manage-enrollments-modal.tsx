"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { Box, Button, Divider, Stack, Tooltip, Typography } from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import {
  EnrollmentStatus,
  ENROLLMENT_STATUS_LABELS,
  type PlanEnrollment,
} from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { BaseModal, EmptyState } from "@repo/ui";

import {
  useCoachAthletes,
  usePauseEnrollment,
  usePlanEnrollments,
  useRemoveEnrollment,
  useResumeEnrollment,
} from "@app/lib/hooks";

import { EnrollAddView } from "./enroll-add-view";
import { EnrollmentRow } from "./enrollment-row";

const MODAL_TITLE = "Manage enrollments";
const ENROLL_LABEL = "Enroll athletes";
const ENROLL_DISABLED_TOOLTIP = "Activate the plan to enroll athletes";
const EMPTY_MESSAGE = "No athletes enrolled yet.";

type ManageEnrollmentsModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  planStatus: TrainingPlanStatus;
};

export const ManageEnrollmentsModal: React.FC<ManageEnrollmentsModalProps> = ({
  open,
  onClose,
  planId,
  planStatus,
}) => {
  const [step, setStep] = useState<"list" | "add">("list");

  useEffect(() => {
    if (!open) {
      setStep("list");
    }
  }, [open]);

  const enrollmentsQuery = usePlanEnrollments(planId);
  const athletesQuery = useCoachAthletes();
  const pause = usePauseEnrollment(planId);
  const resume = useResumeEnrollment(planId);
  const remove = useRemoveEnrollment(planId);

  const rosterById = useMemo(() => {
    const map = new Map<string, CoachAthleteListItem>();

    for (const athlete of athletesQuery.data?.athletes ?? []) {
      map.set(athlete.userId, athlete);
    }

    return map;
  }, [athletesQuery.data]);

  const isMutating = pause.isPending || resume.isPending || remove.isPending;
  const canEnroll = planStatus === TrainingPlanStatus.ACTIVE;

  const enrollments = enrollmentsQuery.data ?? [];
  const active = enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.ACTIVE);
  const paused = enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.PAUSED);
  const hasLiveRows = active.length + paused.length > 0;

  const goToAddStep = () => setStep("add");

  const renderGroup = (status: EnrollmentStatus, group: PlanEnrollment[]): ReactNode => {
    if (group.length === 0) {
      return null;
    }

    return (
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          {ENROLLMENT_STATUS_LABELS[status]} · {group.length}
        </Typography>
        <Stack
          divider={<Divider flexItem />}
          sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
        >
          {group.map((enrollment) => (
            <EnrollmentRow
              key={enrollment.id}
              enrollment={enrollment}
              athlete={rosterById.get(enrollment.athleteId)}
              onPause={() => pause.mutate(enrollment.id)}
              onResume={() => resume.mutate(enrollment.id)}
              onRemove={() => remove.mutate(enrollment.id)}
              isMutating={isMutating}
            />
          ))}
        </Stack>
      </Stack>
    );
  };

  if (step === "add") {
    return (
      <BaseModal open={open} onClose={onClose} title={MODAL_TITLE}>
        <EnrollAddView
          planId={planId}
          canEnroll={canEnroll}
          onBack={() => setStep("list")}
          onEnrolled={() => setStep("list")}
        />
      </BaseModal>
    );
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={MODAL_TITLE}
      actions={
        <Button variant="text" onClick={onClose}>
          Done
        </Button>
      }
    >
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="body2" component="span">
            <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
              {active.length} active
            </Box>
            {` · ${paused.length} paused`}
          </Typography>

          <Tooltip title={canEnroll ? "" : ENROLL_DISABLED_TOOLTIP} arrow>
            <Box component="span">
              <Button
                variant="contained"
                startIcon={<GroupAddIcon />}
                disabled={!canEnroll}
                onClick={goToAddStep}
              >
                {ENROLL_LABEL}
              </Button>
            </Box>
          </Tooltip>
        </Stack>

        {hasLiveRows ? (
          <Stack spacing={2.5}>
            {renderGroup(EnrollmentStatus.ACTIVE, active)}
            {renderGroup(EnrollmentStatus.PAUSED, paused)}
          </Stack>
        ) : (
          <EmptyState
            message={EMPTY_MESSAGE}
            action={{
              label: ENROLL_LABEL,
              onClick: goToAddStep,
              icon: <GroupAddIcon />,
              disabled: !canEnroll,
            }}
          />
        )}
      </Stack>
    </BaseModal>
  );
};
