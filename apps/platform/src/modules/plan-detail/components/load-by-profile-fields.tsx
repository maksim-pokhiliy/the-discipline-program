"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Button, IconButton, Stack, TextField } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";

import { NumberField } from "./number-field";

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
type ProfileEntry = ByProfileLoad["entries"][number];

const MIN_ENTRIES = 1;
const ADD_ENTRY_LABEL = "add profile";
const REMOVE_ARIA = "Remove profile";
const LABEL_PLACEHOLDER = "e.g. m, f, RX, SC";
const LABEL_FIELD_WIDTH = 140;
const KG_FIELD_MIN = 0;
const KG_FIELD_STEP = 0.5;
const KG_FIELD_WIDTH = 110;
const DEFAULT_KG = 0;
const EMPTY_LABEL = "";

const makeEntry = (): ProfileEntry => ({ label: EMPTY_LABEL, kg: DEFAULT_KG });

type LoadByProfileFieldsProps = {
  value: ByProfileLoad;
  onChange: (next: ByProfileLoad) => void;
  disabled?: boolean;
};

export const LoadByProfileFields = ({
  value,
  onChange,
  disabled = false,
}: LoadByProfileFieldsProps): React.ReactElement => {
  const canRemove = value.entries.length > MIN_ENTRIES;

  const updateEntry = (index: number, patch: Partial<ProfileEntry>): void => {
    onChange({
      kind: "byProfile",
      entries: value.entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    });
  };

  const removeEntry = (index: number): void => {
    onChange({ kind: "byProfile", entries: value.entries.filter((_, i) => i !== index) });
  };

  const addEntry = (): void => {
    onChange({ kind: "byProfile", entries: [...value.entries, makeEntry()] });
  };

  return (
    <Stack spacing={1}>
      {value.entries.map((entry, index) => (
        <Stack
          key={index}
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <TextField
            label="Profile"
            size="small"
            value={entry.label}
            onChange={(e) => updateEntry(index, { label: e.target.value })}
            placeholder={LABEL_PLACEHOLDER}
            disabled={disabled}
            sx={{ maxWidth: LABEL_FIELD_WIDTH }}
          />

          <NumberField
            label="Weight (kg)"
            value={entry.kg}
            onChange={(kg) => updateEntry(index, { kg })}
            min={KG_FIELD_MIN}
            step={KG_FIELD_STEP}
            disabled={disabled}
            maxWidth={KG_FIELD_WIDTH}
          />

          <IconButton
            aria-label={REMOVE_ARIA}
            size="small"
            onClick={() => removeEntry(index)}
            disabled={disabled || !canRemove}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}

      <Button
        size="tiny"
        variant="text"
        onClick={addEntry}
        disabled={disabled}
        sx={{ alignSelf: "flex-start" }}
      >
        {ADD_ENTRY_LABEL}
      </Button>
    </Stack>
  );
};
