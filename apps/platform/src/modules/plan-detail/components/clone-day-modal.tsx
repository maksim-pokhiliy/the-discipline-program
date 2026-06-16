"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Stack } from "@mui/material";
import { toast } from "sonner";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { DaySlot } from "@repo/contracts/lms/day";
import type { PopulatedWeek } from "@repo/contracts/lms/week";
import { BaseModal, ConfirmationModal } from "@repo/ui";

import { useCloneDayFrom, useListPopulatedWeeks, useWeek } from "@app/lib/hooks";

import { formatDayLabel } from "../lib/format-day-label";
import { formatWeekLabel } from "../lib/format-week-label";

import { DaySourceList } from "./day-source-list";
import { WeekSourceList } from "./week-source-list";

const PICK_WEEK_TITLE = "Pick a source week";
const PICK_DAY_TITLE = "Pick a source day";
const CONFIRM_TITLE = "Replace this day";
const EMPTY_NOTICE_TITLE = "Nothing to clone";
const CONFIRM_TEXT = "Replace day";
const LOAD_ERROR = "Couldn't load weeks — try again.";

type CloneDayModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  targetStartDate: string;
  targetDayOfWeek: DayOfWeek;
  currentSessionCount: number;
};

export const CloneDayModal: React.FC<CloneDayModalProps> = ({
  open,
  onClose,
  planId,
  targetStartDate,
  targetDayOfWeek,
  currentSessionCount,
}) => {
  const [step, setStep] = useState<"pick-week" | "pick-day" | "confirming">("pick-week");
  const [pickedWeek, setPickedWeek] = useState<PopulatedWeek | null>(null);
  const [pickedDay, setPickedDay] = useState<DaySlot | null>(null);
  const [hasEmptyNotice, setHasEmptyNotice] = useState<boolean>(false);

  const weeksQuery = useListPopulatedWeeks(planId, open && step === "pick-week");
  const sourceWeekQuery = useWeek(planId, pickedWeek?.startDate ?? "");
  const cloneDay = useCloneDayFrom(planId, targetStartDate, targetDayOfWeek);

  useEffect(() => {
    if (!open) {
      setStep("pick-week");
      setPickedWeek(null);
      setPickedDay(null);
      setHasEmptyNotice(false);
    }
  }, [open]);

  const handleWeekPick = (startDate: string) => {
    const source = weeksQuery.data?.weeks.find((week) => week.startDate === startDate) ?? null;

    if (source) {
      setPickedWeek(source);
      setStep("pick-day");
    }
  };

  const handleDayPick = (dayOfWeek: DayOfWeek) => {
    if (sourceWeekQuery.isFetching) {
      return;
    }

    const day = sourceWeekQuery.data?.days.find((slot) => slot.dayOfWeek === dayOfWeek) ?? null;

    if (day) {
      setPickedDay(day);
      setStep("confirming");
    }
  };

  const handleConfirm = () => {
    if (!pickedWeek || !pickedDay) {
      return;
    }

    cloneDay.mutate(
      { sourceStartDate: pickedWeek.startDate, sourceDayOfWeek: pickedDay.dayOfWeek },
      {
        onSuccess: (result) => {
          if (result.cloned) {
            toast.success(`Day replaced — ${result.day.sessions.length} sessions cloned.`);
            onClose();
          } else {
            setHasEmptyNotice(true);
          }
        },
      },
    );
  };

  const handleBack = () => {
    setStep("pick-week");
    setPickedWeek(null);
    setPickedDay(null);
  };
  const handleCancel = () => setStep("pick-day");

  if (hasEmptyNotice && pickedDay && pickedWeek) {
    return (
      <BaseModal open={open} onClose={onClose} title={EMPTY_NOTICE_TITLE} maxWidth="xs">
        <Alert severity="info">
          {formatDayLabel(pickedDay.dayOfWeek)} of {formatWeekLabel(pickedWeek.startDate)} is empty
          — nothing to clone. This day was left unchanged.
        </Alert>
      </BaseModal>
    );
  }

  if (step === "confirming" && pickedWeek && pickedDay) {
    return (
      <ConfirmationModal
        open={open}
        onClose={handleCancel}
        title={CONFIRM_TITLE}
        type="danger"
        message={`This day's ${currentSessionCount} sessions will be deleted and replaced with ${formatDayLabel(pickedDay.dayOfWeek)} of ${formatWeekLabel(pickedWeek.startDate)} (${pickedDay.sessions.length} sessions). This can't be undone.`}
        confirmText={CONFIRM_TEXT}
        isConfirming={cloneDay.isPending}
        error={cloneDay.error ? cloneDay.error.message : null}
        onConfirm={handleConfirm}
      />
    );
  }

  if (step === "pick-day" && pickedWeek) {
    return (
      <BaseModal open={open} onClose={onClose} title={PICK_DAY_TITLE}>
        <DaySourceList
          days={sourceWeekQuery.data?.days ?? []}
          sourceLabel={formatWeekLabel(pickedWeek.startDate)}
          isLoading={sourceWeekQuery.isFetching}
          onPick={handleDayPick}
          onBack={handleBack}
        />
      </BaseModal>
    );
  }

  return (
    <BaseModal open={open} onClose={onClose} title={PICK_WEEK_TITLE}>
      {weeksQuery.error ? (
        <Stack spacing={2}>
          <Alert severity="error">{LOAD_ERROR}</Alert>

          <Button variant="outlined" onClick={() => weeksQuery.refetch()}>
            Retry
          </Button>
        </Stack>
      ) : (
        <WeekSourceList
          weeks={weeksQuery.data?.weeks ?? []}
          isLoading={weeksQuery.isLoading}
          onPick={handleWeekPick}
        />
      )}
    </BaseModal>
  );
};
