"use client";

import { useId } from "react";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";

import {
  type SchemeArchetypeKind,
  type SchemeParams,
  SCHEME_ARCHETYPE_KINDS,
  defaultSchemeParams,
} from "@repo/contracts/lms/_domain";

import { SchemeForm } from "../scheme-form";

import { type BlockSegmentEditorProps } from "./block-segment-editor.types";

export const BlockSegmentEditor = ({
  segment,
  onChange,
  disabled = false,
  labelSlotProps,
}: BlockSegmentEditorProps) => {
  const archetypeLabelId = useId();

  const handleArchetypeChange = (next: SchemeArchetypeKind) => {
    if (next === segment.archetypeKind) {
      return;
    }

    onChange((prev) => ({
      ...prev,
      archetypeKind: next,
      schemeParams: defaultSchemeParams(next),
      schemeTemplateId: null,
    }));
  };

  const handleSchemeParamsChange = (nextParams: SchemeParams) => {
    onChange((prev) => ({ ...prev, schemeParams: nextParams }));
  };

  const handleLabelChange = (raw: string) => {
    const label = raw.trim() === "" ? null : raw;

    onChange((prev) => ({ ...prev, label }));
  };

  const handleOrderChange = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    onChange((prev) => ({ ...prev, order: parsed }));
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Label"
        size="small"
        value={segment.label ?? ""}
        onChange={(event) => {
          labelSlotProps?.onChange?.(event);
          handleLabelChange(event.target.value);
        }}
        {...(labelSlotProps?.onKeyDown && { onKeyDown: labelSlotProps.onKeyDown })}
        {...(labelSlotProps?.onBlur && { onBlur: labelSlotProps.onBlur })}
        {...(labelSlotProps?.inputRef && { inputRef: labelSlotProps.inputRef })}
        disabled={disabled}
        helperText="Optional segment label · type / for templates"
      />

      <TextField
        label="Order"
        size="small"
        type="number"
        value={segment.order}
        onChange={(event) => handleOrderChange(event.target.value)}
        disabled={disabled}
        inputProps={{ min: 0 }}
      />

      <TextField
        id={archetypeLabelId}
        label="Archetype"
        select
        size="small"
        value={segment.archetypeKind}
        onChange={(event) => handleArchetypeChange(event.target.value as SchemeArchetypeKind)}
        disabled={disabled}
      >
        {SCHEME_ARCHETYPE_KINDS.map((kind) => (
          <MenuItem key={kind} value={kind}>
            {kind.replace(/_/gu, " ")}
          </MenuItem>
        ))}
      </TextField>

      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Scheme params
        </Typography>
        <SchemeForm
          archetypeKind={segment.archetypeKind}
          schemeParams={segment.schemeParams}
          onChange={handleSchemeParamsChange}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  );
};

export type {
  BlockSegmentEditorLabelSlotProps,
  BlockSegmentEditorProps,
} from "./block-segment-editor.types";
