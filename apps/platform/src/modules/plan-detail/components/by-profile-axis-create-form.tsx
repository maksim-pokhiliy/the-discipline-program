"use client";

import { useState } from "react";

import { Button, Stack, TextField, Typography } from "@mui/material";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { TagsInput } from "@repo/ui";

import { useCreateProfileAxis } from "@app/lib/hooks/use-create-profile-axis";

const TITLE = "Create a new axis";
const NAME_LABEL = "Axis name";
const VALUES_LABEL = "Values";
const VALUES_PLACEHOLDER = "e.g. RX";
const VALUES_HELPER = "Press Enter to add a value. At least one required.";
const CREATE_LABEL = "Create axis";
const CANCEL_LABEL = "Cancel";
const NO_VALUES = 0;

type ByProfileAxisCreateFormProps = {
  initialName: string;
  onCreated: (axis: ProfileAxis) => void;
  onCancel: () => void;
  disabled?: boolean;
};

export const ByProfileAxisCreateForm = ({
  initialName,
  onCreated,
  onCancel,
  disabled = false,
}: ByProfileAxisCreateFormProps): React.ReactElement => {
  const [name, setName] = useState(initialName);
  const [values, setValues] = useState<string[]>([]);
  const createAxis = useCreateProfileAxis();

  const hasName = name.trim() !== "";
  const hasValues = values.length > NO_VALUES;
  const isPending = createAxis.isPending;
  const canCreate = hasName && hasValues && !isPending && !disabled;

  const handleCreate = (): void => {
    const trimmedName = name.trim();

    createAxis
      .mutateAsync({ key: trimmedName, label: trimmedName, values })
      .then((axis) => {
        onCreated(axis);
      })
      .catch(() => undefined);
  };

  return (
    <Stack spacing={1.5} sx={{ pl: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {TITLE}
      </Typography>

      <TextField
        label={NAME_LABEL}
        size="small"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={isPending || disabled}
        fullWidth
      />

      <TagsInput
        label={VALUES_LABEL}
        placeholder={VALUES_PLACEHOLDER}
        helperText={VALUES_HELPER}
        value={values}
        onChange={setValues}
        disabled={isPending || disabled}
      />

      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" onClick={handleCreate} disabled={!canCreate}>
          {CREATE_LABEL}
        </Button>

        <Button size="small" variant="text" onClick={onCancel} disabled={isPending}>
          {CANCEL_LABEL}
        </Button>
      </Stack>
    </Stack>
  );
};
