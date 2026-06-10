"use client";

import { type ReactElement } from "react";

import { Checkbox, FormControlLabel } from "@mui/material";

const GROUP_INTO_BOX_LABEL = "Group into one box";

type GroupIntoBoxCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const GroupIntoBoxCheckbox: React.FC<GroupIntoBoxCheckboxProps> = ({
  checked,
  onChange,
}): ReactElement => (
  <FormControlLabel
    control={
      <Checkbox
        size="small"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    }
    label={GROUP_INTO_BOX_LABEL}
  />
);
