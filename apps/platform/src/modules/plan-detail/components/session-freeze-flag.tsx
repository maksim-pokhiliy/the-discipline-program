"use client";

import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { Chip, Tooltip } from "@mui/material";

type SessionFreezeFlagProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

const FROZEN_TOOLTIP = "% loads frozen to athlete's current 1RM at session creation";
const LIVE_TOOLTIP = "Click to freeze % loads to kg when this session is created";

const tooltipWrapStyle = { display: "inline-flex" } as const;

export const SessionFreezeFlag: React.FC<SessionFreezeFlagProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  if (value) {
    return (
      <Tooltip title={FROZEN_TOOLTIP}>
        <span style={tooltipWrapStyle}>
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
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={LIVE_TOOLTIP}>
      <span style={tooltipWrapStyle}>
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
      </span>
    </Tooltip>
  );
};
