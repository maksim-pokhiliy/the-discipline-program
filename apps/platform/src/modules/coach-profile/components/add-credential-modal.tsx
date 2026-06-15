"use client";

import { type FormEvent, useState } from "react";

import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";

import { COACH_CREDENTIAL_CONSTANTS } from "@repo/contracts/coaching/coach-credential";
import { FormModal } from "@repo/ui";

import { useCreateCredential } from "@app/lib/hooks";

type AddCredentialModalProps = {
  open: boolean;
  onClose: () => void;
};

type CredentialFormState = {
  title: string;
  issuer: string;
  year: string;
  shownToAthletes: boolean;
};

const CURRENT_YEAR = new Date().getFullYear();

const createInitialState = (): CredentialFormState => ({
  title: "",
  issuer: "",
  year: String(CURRENT_YEAR),
  shownToAthletes: true,
});

const isYearValid = (year: number): boolean =>
  Number.isInteger(year) && year >= COACH_CREDENTIAL_CONSTANTS.MIN_YEAR && year <= CURRENT_YEAR;

export const AddCredentialModal: React.FC<AddCredentialModalProps> = ({ open, onClose }) => {
  const [form, setForm] = useState<CredentialFormState>(createInitialState);
  const createCredential = useCreateCredential();

  const parsedYear = Number(form.year);
  const hasTitle = form.title.trim().length > 0;
  const hasIssuer = form.issuer.trim().length > 0;
  const hasValidYear = isYearValid(parsedYear);
  const isFormValid = hasTitle && hasIssuer && hasValidYear;

  const handleClose = () => {
    setForm(createInitialState());
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    createCredential.mutate(
      {
        title: form.title.trim(),
        issuer: form.issuer.trim(),
        year: parsedYear,
        shownToAthletes: form.shownToAthletes,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Add credential"
      onSubmit={handleSubmit}
      isSubmitting={createCredential.isPending}
      submitText="Add"
      submitDisabled={!isFormValid}
    >
      <Stack spacing={3}>
        <TextField
          label="Title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          fullWidth
          required
          slotProps={{ htmlInput: { maxLength: COACH_CREDENTIAL_CONSTANTS.MAX_TITLE_LENGTH } }}
        />

        <TextField
          label="Issuer"
          value={form.issuer}
          onChange={(event) => setForm((prev) => ({ ...prev, issuer: event.target.value }))}
          fullWidth
          required
          slotProps={{ htmlInput: { maxLength: COACH_CREDENTIAL_CONSTANTS.MAX_ISSUER_LENGTH } }}
        />

        <TextField
          label="Year"
          type="number"
          value={form.year}
          onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
          fullWidth
          required
          error={form.year.length > 0 && !hasValidYear}
          helperText={`Between ${COACH_CREDENTIAL_CONSTANTS.MIN_YEAR} and ${CURRENT_YEAR}`}
          slotProps={{ htmlInput: { min: COACH_CREDENTIAL_CONSTANTS.MIN_YEAR, max: CURRENT_YEAR } }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.shownToAthletes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, shownToAthletes: event.target.checked }))
              }
            />
          }
          label="Shown to athletes"
        />
      </Stack>
    </FormModal>
  );
};
