"use client";

import { type FormEvent, useState } from "react";

import { TextField } from "@mui/material";

import { FormModal } from "@repo/ui";

import { useCreateTrainingPlan } from "@app/lib/hooks";

type CreatePlanDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateTrainingPlan();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    create.mutate(
      { name: trimmedName, description: description.trim() || undefined },
      { onSuccess: () => handleClose() },
    );
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="New Training Plan"
      onSubmit={handleSubmit}
      isSubmitting={create.isPending}
      submitText="Create"
      submitDisabled={!name.trim()}
    >
      <TextField
        label="Plan name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        size="medium"
        fullWidth
        disabled={create.isPending}
      />

      <TextField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={8}
        size="medium"
        fullWidth
        disabled={create.isPending}
      />
    </FormModal>
  );
};
