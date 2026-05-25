"use client";

import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { Chip } from "@mui/material";

type SessionFreezeFlagProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export const SessionFreezeFlag: React.FC<SessionFreezeFlagProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  if (value) {
    return (
      <Chip
        size="small"
        color="info"
        icon={<LockIcon />}
        label="frozen"
        clickable
        onClick={() => onChange(false)}
        disabled={disabled}
        aria-label="Freeze: frozen (click to switch to live)"
      />
    );
  }

  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<LockOpenIcon />}
      label="live"
      clickable
      onClick={() => onChange(true)}
      disabled={disabled}
      aria-label="Freeze: live (click to freeze)"
    />
  );
};
