import { Box, Stack, Typography } from "@mui/material";

type SettingRowProps = {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode | undefined;
  action?: React.ReactNode | undefined;
};

export const SettingRow: React.FC<SettingRowProps> = ({ label, value, helper, action }) => (
  <Stack
    direction="row"
    spacing={1.75}
    alignItems="center"
    justifyContent="space-between"
    sx={(theme) => ({
      p: 1.75,
      borderTop: `1px solid ${theme.palette.divider}`,

      "&:first-of-type": { borderTop: "none" },
    })}
  >
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>

      <Box sx={{ typography: "body1", fontWeight: 600, color: "text.primary" }}>{value}</Box>

      {helper && (
        <Typography variant="caption" color="text.muted">
          {helper}
        </Typography>
      )}
    </Stack>

    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Stack>
);
