import CheckCircle from "@mui/icons-material/CheckCircle";
import { alpha, Stack } from "@mui/material";

import { ContentSection } from "@repo/ui";

export const PaymentSuccessHeroSection = () => {
  return (
    <ContentSection
      title="Payment Successful!"
      subtitle="Welcome to The Discipline Program! Your transformation journey begins now."
    >
      <Stack sx={{ alignItems: "center" }}>
        <Stack
          sx={(theme) => ({
            width: theme.spacing(15),
            height: theme.spacing(15),
            borderRadius: "50%",
            backgroundColor: "success.main",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${theme.spacing(4)} ${alpha(theme.palette.success.light, 0.4)}`,
          })}
        >
          <CheckCircle sx={(theme) => ({ fontSize: theme.spacing(10), color: "common.white" })} />
        </Stack>
      </Stack>
    </ContentSection>
  );
};
