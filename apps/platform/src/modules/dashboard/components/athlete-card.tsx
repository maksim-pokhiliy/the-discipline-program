"use client";

import { Alert, type AlertColor, AlertTitle, Avatar, Chip, type ChipProps } from "@mui/material";

export type AthleteCardChip = {
  label: string;
  color: ChipProps["color"];
  icon?: React.ReactElement;
};

type AthleteCardProps = {
  name: string;
  image?: string | null;
  severity: AlertColor;
  message: string;
  chips?: AthleteCardChip[];
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
