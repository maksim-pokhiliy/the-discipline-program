"use client";

import { type FormEvent, useEffect, useState } from "react";

import { TextField } from "@mui/material";

import { FormModal } from "@repo/ui";

import { useCreateWorkout } from "@app/lib/hooks";

import { formatDateParam } from "./week-helpers";

type CreateWorkoutDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  defaultDate: Date | null;
};

export const CreateWorkoutDialog: React.FC<CreateWorkoutDialogProps> = ({
  open,
  onClose,
  planId,
  defaultDate,
}) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const create = useCreateWorkout(planId);

  useEffect(() => {
    if (open && defaultDate) {
      setDate(formatDateParam(defaultDate));
    }
  }, [open, defaultDate]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    create.mutate(
      {
        title: trimmedTitle,
        scheduledDate: date ? new Date(`${date}T00:00:00`) : undefined,
      },
      { onSuccess: () => handleClose() },
    );
  };

  const handleClose = () => {
    setTitle("");
    setDate("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="New Workout"
      onSubmit={handleSubmit}
      isSubmitting={create.isPending}
      submitText="Create"
      submitDisabled={!title.trim()}
    >
      <TextField
        label="Workout title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        size="small"
        fullWidth
        disabled={create.isPending}
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />

      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        size="small"
        fullWidth
        disabled={create.isPending}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </FormModal>
  );
};
