"use client";

import { useMemo } from "react";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { type SelectChangeEvent } from "@mui/material/Select";

import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";

import { usePlanEnrollments } from "@app/lib/hooks";

import {
  ALL_TARGET,
  type EditingTarget,
  formatEditingTarget,
  parseEditingTarget,
  useEditingTarget,
} from "../lib/editing-target";

const ALL_VALUE = "all";

const buildLabel = (entry: PlanRosterEntry): string => {
  const name = entry.user.name?.trim();

  if (name) {
    return name;
  }

  const email = entry.user.email.trim();

  if (email) {
    return email;
  }

  return entry.user.id;
};

export type TargetSwitcherProps = {
  planId: string;
};

export const TargetSwitcher = ({ planId }: TargetSwitcherProps) => {
  const { target, setTarget } = useEditingTarget();
  const enrollmentsQuery = usePlanEnrollments(planId);

  const enrollments = useMemo(() => enrollmentsQuery.data ?? [], [enrollmentsQuery.data]);

  const value = formatEditingTarget(target) ?? ALL_VALUE;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const next: EditingTarget =
      event.target.value === ALL_VALUE ? ALL_TARGET : parseEditingTarget(event.target.value);

    setTarget(next);
  };

  if (enrollments.length === 0) {
    return null;
  }

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel id="target-switcher-label">Editing for</InputLabel>
      <Select
        labelId="target-switcher-label"
        label="Editing for"
        value={value}
        onChange={handleChange}
      >
        <MenuItem value={ALL_VALUE}>All athletes</MenuItem>
        {enrollments.map((entry) => {
          const optionValue = formatEditingTarget({ kind: "athlete", enrollmentId: entry.id });

          if (!optionValue) {
            return null;
          }

          return (
            <MenuItem key={entry.id} value={optionValue}>
              {buildLabel(entry)}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
