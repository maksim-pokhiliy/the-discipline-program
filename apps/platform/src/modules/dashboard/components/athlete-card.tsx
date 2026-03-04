"use client";

import {
  Alert,
  type AlertColor,
  AlertTitle,
  Avatar,
  Chip,
  type ChipProps,
  Stack,
  Typography,
} from "@mui/material";

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
    icon={
      <Avatar src={image ?? undefined} sx={{ width: 32, height: 32 }}>
        {name[0]?.toUpperCase()}
      </Avatar>
    }
    action={action}
  >
    <Stack spacing={0.25}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <AlertTitle gutterBottom={false}>{name}</AlertTitle>

        {chips?.map((chip) => (
          <Chip
            key={chip.label}
            size="small"
            label={chip.label}
            color={chip.color}
            icon={chip.icon}
            sx={{ height: 22 }}
          />
        ))}
      </Stack>

      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {message}
      </Typography>

      {details && (
        <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.8 }}>
          {details}
        </Typography>
      )}
    </Stack>
  </Alert>
);
