import { Stack, Typography } from "@mui/material";

type PlanDetailViewProps = { planId: string };

export const PlanDetailView = ({ planId: _planId }: PlanDetailViewProps) => (
  <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
    <Typography variant="h5" color="text.secondary">
      Coming soon
    </Typography>
  </Stack>
);
