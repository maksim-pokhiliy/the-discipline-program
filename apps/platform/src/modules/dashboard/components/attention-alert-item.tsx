"use client";

import { Alert, type AlertColor, AlertTitle } from "@mui/material";
import Link from "next/link";

import type { AttentionAlert } from "@repo/contracts/coach-dashboard";

const SEVERITY_MAP: Record<AttentionAlert["severity"], AlertColor> = {
  CRITICAL: "error",
  WARNING: "warning",
  INFO: "info",
};

type AttentionAlertItemProps = {
  alert: AttentionAlert;
};

export const AttentionAlertItem: React.FC<AttentionAlertItemProps> = ({ alert }) => {
  return (
    <Link href={alert.href} style={{ textDecoration: "none" }}>
      <Alert
        severity={SEVERITY_MAP[alert.severity]}
        variant="filled"
        sx={(theme) => ({
          transition: theme.transitions.create("filter", {
            duration: theme.transitions.duration.short,
          }),
          "&:hover": { filter: "brightness(1.1)" },
        })}
      >
        {alert.athleteName && <AlertTitle>{alert.athleteName}</AlertTitle>}
        {alert.message}
      </Alert>
    </Link>
  );
};
