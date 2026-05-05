import { Stack } from "@mui/material";

import { PageHeader } from "@repo/ui";

const PlanDetailPage = () => {
  return (
    <Stack>
      <PageHeader title="Plan" backHref="/coach/plans" />
    </Stack>
  );
};

export default PlanDetailPage;
