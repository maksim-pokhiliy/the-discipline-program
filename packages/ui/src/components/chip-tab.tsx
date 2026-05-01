"use client";

import { Chip, type ChipProps, Stack, Tab, type TabProps, Typography } from "@mui/material";

export type ChipTabProps = Omit<TabProps, "label"> & {
  label: string;
  count: number;
  chipColor?: ChipProps["color"] | undefined;
};

export const ChipTab: React.FC<ChipTabProps> = ({ label, count, chipColor, ...props }) => (
  <Tab
    {...props}
    label={
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Typography variant="body2" component="span">
          {label}
        </Typography>
        <Chip size="small" label={count} {...(chipColor !== undefined && { color: chipColor })} />
      </Stack>
    }
  />
);
