"use client";

import { Alert, type AlertColor, AlertTitle, Avatar, Stack } from "@mui/material";

import { StatusChip, type StatusChipConfig } from "@repo/ui";

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
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {name}
        {chips?.map((chip) => <StatusChip key={chip.label} {...chip} />)}
      </Stack>
    </AlertTitle>

    {message}

    {details}
  </Alert>
);
