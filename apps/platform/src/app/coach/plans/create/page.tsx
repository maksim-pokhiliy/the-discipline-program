import { Stack, Typography } from "@mui/material";

import { PlatformPageHeader } from "@app/lib/components";

export default function PlanCreatePage() {
  return (
    <Stack spacing={1}>
      <PlatformPageHeader title="Create Plan" backHref="/coach/plans" />
      <Typography variant="body2" color="text.secondary">
        Coming soon
      </Typography>
    </Stack>
  );
}
