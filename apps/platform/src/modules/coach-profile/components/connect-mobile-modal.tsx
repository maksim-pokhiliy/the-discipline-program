"use client";

import { type FormEvent, useState } from "react";

import { Stack, TextField } from "@mui/material";

import { FormModal } from "@repo/ui";

import { useConnectMobile } from "@app/lib/hooks";

type ConnectMobileModalProps = {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
  title?: string;
};

type ConnectFormState = {
  email: string;
  password: string;
};

const createInitialState = (): ConnectFormState => ({
  email: "",
  password: "",
});

const DEFAULT_TITLE = "Connect mobile app";

export const ConnectMobileModal: React.FC<ConnectMobileModalProps> = ({
  open,
  onClose,
  onConnected,
  title,
}) => {
  const [form, setForm] = useState<ConnectFormState>(createInitialState);
  const connect = useConnectMobile();

  const hasEmail = form.email.trim().length > 0;
  const hasPassword = form.password.length > 0;
  const isFormValid = hasEmail && hasPassword;

  const handleClose = () => {
    setForm(createInitialState());
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    connect.mutate(
      { email: form.email.trim(), password: form.password },
      {
        onSuccess: () => {
          handleClose();
          onConnected?.();
        },
      },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={title ?? DEFAULT_TITLE}
      onSubmit={handleSubmit}
      isSubmitting={connect.isPending}
      submitText="Connect"
      submitDisabled={!isFormValid}
    >
      <Stack spacing={3}>
        <TextField
          label="Mobile app email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          fullWidth
          required
        />

        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          fullWidth
          required
        />
      </Stack>
    </FormModal>
  );
};
