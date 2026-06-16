"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Stack } from "@mui/material";
import { toast } from "sonner";

import type { PopulatedWeek } from "@repo/contracts/lms/week";
import { BaseModal, ConfirmationModal } from "@repo/ui";

import { useCloneWeekFrom, useListPopulatedWeeks } from "@app/lib/hooks";

import { formatWeekLabel } from "../lib/format-week-label";

import { WeekSourceList } from "./week-source-list";

const PICK_TITLE = "Clone into this week";
const CONFIRM_TITLE = "Replace this week";
const EMPTY_NOTICE_TITLE = "Nothing to clone";
const CONFIRM_TEXT = "Replace week";
const LOAD_ERROR = "Couldn't load weeks — try again.";

type CloneWeekModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  targetStartDate: string;
  currentSessionCount: number;
};

export const CloneWeekModal: React.FC<CloneWeekModalProps> = ({
  open,
  onClose,
  planId,
  targetStartDate,
  currentSessionCount,
}) => {
  const [step, setStep] = useState<"picking" | "confirming">("picking");
  const [pickedSource, setPickedSource] = useState<PopulatedWeek | null>(null);
  const [hasEmptyNotice, setHasEmptyNotice] = useState<boolean>(false);

  const weeksQuery = useListPopulatedWeeks(planId, open);
  const cloneWeek = useCloneWeekFrom(planId, targetStartDate);

  useEffect(() => {
    if (!open) {
      setStep("picking");
      setPickedSource(null);
      setHasEmptyNotice(false);
    }
  }, [open]);

  const handlePick = (startDate: string) => {
    const source = weeksQuery.data?.weeks.find((week) => week.startDate === startDate) ?? null;

    if (source) {
      setPickedSource(source);
      setStep("confirming");
    }
  };

  const handleConfirm = () => {
    if (!pickedSource) {
      return;
    }

    cloneWeek.mutate(
      { sourceStartDate: pickedSource.startDate },
      {
        onSuccess: (result) => {
          if (result.cloned) {
            toast.success(`Week replaced — ${pickedSource.sessionCount} sessions cloned.`);
            onClose();
          } else {
            setHasEmptyNotice(true);
          }
        },
      },
    );
  };

  const handleCancel = () => setStep("picking");

  if (hasEmptyNotice && pickedSource) {
    return (
      <BaseModal open={open} onClose={onClose} title={EMPTY_NOTICE_TITLE} maxWidth="xs">
        <Alert severity="info">
          {formatWeekLabel(pickedSource.startDate)} is empty — nothing to clone. This week was left
          unchanged.
        </Alert>
      </BaseModal>
    );
  }

  if (step === "confirming" && pickedSource) {
    return (
      <ConfirmationModal
        open={open}
        onClose={handleCancel}
        title={CONFIRM_TITLE}
        type="danger"
        message={`This week's ${currentSessionCount} sessions will be deleted and replaced with ${formatWeekLabel(pickedSource.startDate)} (${pickedSource.sessionCount} sessions). This can't be undone.`}
        confirmText={CONFIRM_TEXT}
        isConfirming={cloneWeek.isPending}
        error={cloneWeek.error ? cloneWeek.error.message : null}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <BaseModal open={open} onClose={onClose} title={PICK_TITLE}>
      {weeksQuery.error ? (
        <Stack spacing={2}>
          <Alert severity="error">{LOAD_ERROR}</Alert>

          <Button variant="outlined" onClick={() => weeksQuery.refetch()}>
            Retry
          </Button>
        </Stack>
      ) : (
        <WeekSourceList
          weeks={(weeksQuery.data?.weeks ?? []).filter(
            (week) => week.startDate !== targetStartDate,
          )}
          isLoading={weeksQuery.isLoading}
          onPick={handlePick}
        />
      )}
    </BaseModal>
  );
};
