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
const CREATE_ERROR =
  "Couldn't create — an axis with this name may already exist; pick it from the list.";

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
  const [hasError, setHasError] = useState(false);
  const createAxis = useCreateProfileAxis();

  const hasName = name.trim() !== "";
  const hasValues = values.length > NO_VALUES;
  const isPending = createAxis.isPending;
  const canCreate = hasName && hasValues && !isPending && !disabled;

  const handleCreate = async (): Promise<void> => {
    const trimmedName = name.trim();

    setHasError(false);

    try {
      const axis = await createAxis.mutateAsync({
        key: trimmedName,
        label: trimmedName,
        values,
      });

      onCreated(axis);
    } catch {
      setHasError(true);
    }
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
        onChange={(event) => {
          setHasError(false);
          setName(event.target.value);
        }}
        disabled={isPending || disabled}
        error={hasError}
        {...(hasError && { helperText: CREATE_ERROR })}
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
