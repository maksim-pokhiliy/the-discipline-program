"use client";

import { useState } from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Button } from "@mui/material";

import { ConfirmationModal } from "@repo/ui";

import { useCopyWeek, useWorkouts } from "@app/lib/hooks";

import { addDays } from "./week-helpers";

type CopyWeekButtonProps = {
  planId: string;
  currentWeekStart: Date;
};

export const CopyWeekButton: React.FC<CopyWeekButtonProps> = ({ planId, currentWeekStart }) => {
  const copyWeek = useCopyWeek(planId);
  const { data: workouts } = useWorkouts(planId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const previousWeekStart = addDays(currentWeekStart, -7);
  const weekEnd = addDays(currentWeekStart, 7);

  const currentWeekWorkouts =
    workouts?.filter(
      (w) =>
        w.scheduledDate &&
        new Date(w.scheduledDate) >= currentWeekStart &&
        new Date(w.scheduledDate) < weekEnd,
    ) ?? [];

  const handleCopy = () => {
    if (currentWeekWorkouts.length > 0) {
      setConfirmOpen(true);
    } else {
      copyWeek.mutate({ sourceDate: previousWeekStart, targetDate: currentWeekStart });
    }
  };

  const doCopy = () => {
    copyWeek.mutate(
      { sourceDate: previousWeekStart, targetDate: currentWeekStart },
      { onSuccess: () => setConfirmOpen(false) },
    );
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<ContentCopyIcon />}
        onClick={handleCopy}
        disabled={copyWeek.isPending}
      >
        {copyWeek.isPending ? "Copying..." : "Copy previous week"}
      </Button>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Copy Previous Week"
        type="warning"
        message={`This week already has ${currentWeekWorkouts.length} workout${currentWeekWorkouts.length === 1 ? "" : "s"}. Copied workouts will be added alongside existing ones.`}
        confirmText="Copy anyway"
        isConfirming={copyWeek.isPending}
        onConfirm={doCopy}
      />
    </>
  );
};
