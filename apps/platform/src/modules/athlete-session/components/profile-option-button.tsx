import { type ReactElement } from "react";

import { Button } from "@mui/material";

export type ProfileOptionButtonProps = {
  label: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
};

export const ProfileOptionButton = ({
  label,
  isActive,
  disabled,
  onClick,
}: ProfileOptionButtonProps): ReactElement => (
  <Button
    fullWidth
    size="small"
    color="primary"
    variant={isActive ? "contained" : "outlined"}
    disabled={disabled}
    onClick={onClick}
  >
    {label}
  </Button>
);
