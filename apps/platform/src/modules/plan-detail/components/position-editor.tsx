"use client";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import { POSITIONS, type Position } from "@repo/contracts/lms/schema-row";

import { formatPosition } from "../lib/format-position";

const POSITION_NONE_LABEL = "— no position —";
const POSITION_FIELD_MIN_WIDTH = 220;
const POSITION_FIELD_LABEL = "Position";

type PositionEditorProps = {
  value: Position | null;
  onChange: (next: Position | null) => void;
  disabled?: boolean;
};

export const PositionEditor = ({ value, onChange, disabled = false }: PositionEditorProps) => (
  <FormControl size="small" sx={{ minWidth: POSITION_FIELD_MIN_WIDTH }} disabled={disabled}>
    <InputLabel>{POSITION_FIELD_LABEL}</InputLabel>
    <Select<Position | "">
      value={value ?? ""}
      label={POSITION_FIELD_LABEL}
      onChange={(e) => onChange(e.target.value === "" ? null : (e.target.value as Position))}
    >
      <MenuItem value="">{POSITION_NONE_LABEL}</MenuItem>
      {POSITIONS.map((position) => (
        <MenuItem key={position} value={position}>
          {formatPosition(position)}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);
