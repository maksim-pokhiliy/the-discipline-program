"use client";

import { Alert, type AlertColor, AlertTitle, Avatar, Chip } from "@mui/material";

import type { StatusChipConfig } from "@app/lib/components";

type AthleteCardProps = {
  name: string;
  image?: string | null;
  severity: AlertColor;
  message: string;
  chips?: StatusChipConfig[];
  details?: string;
  action?: React.ReactNode;
};

export const AthleteCard: React.FC<AthleteCardProps> = ({
  name,
  image,
  severity,
  message,
  chips,
  details,
  action,
}) => (
  <Alert
    severity={severity}
    variant="filled"
    icon={<Avatar src={image ?? undefined}>{name[0]?.toUpperCase()}</Avatar>}
    action={action}
  >
    <AlertTitle>
      {name}
      {chips?.map((chip) => (
        <Chip
          key={chip.label}
          size="small"
          label={chip.label}
          color={chip.color}
          icon={chip.icon}
          variant="outlined"
          sx={{ ml: 1 }}
        />
      ))}
    </AlertTitle>

    {message}

    {details && details}
  </Alert>
);
