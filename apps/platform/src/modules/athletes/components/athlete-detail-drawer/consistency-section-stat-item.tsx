import { Stack, Typography } from "@mui/material";

type ConsistencySectionStatItemProps = {
  label: string;
  value: string;
};

export const ConsistencySectionStatItem: React.FC<ConsistencySectionStatItemProps> = ({
  label,
  value,
}) => (
  <Stack sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="h6">{value}</Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
  </Stack>
);
