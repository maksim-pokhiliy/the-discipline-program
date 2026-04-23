"use client";

import { useState } from "react";

import { TextField } from "@mui/material";

import { FormModal } from "@repo/ui";

import { useInviteAthlete } from "@app/lib/hooks";

type InviteAthleteDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const InviteAthleteDialog: React.FC<InviteAthleteDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const invite = useInviteAthlete();

  const handleClose = () => {
    if (invite.isPending) {
      return;
    }

    setEmail("");
    setName("");
    onClose();
  };

  const handleSubmit = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    const trimmedName = name.trim();

    invite.mutate(
      { email: trimmedEmail, name: trimmedName ? trimmedName : null },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Invite athlete"
      onSubmit={handleSubmit}
      isSubmitting={invite.isPending}
      submitText="Send invite"
      submitDisabled={!email.trim()}
    >
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
        size="medium"
        fullWidth
        disabled={invite.isPending}
      />

      <TextField
        label="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="medium"
        fullWidth
        disabled={invite.isPending}
      />
    </FormModal>
  );
};
