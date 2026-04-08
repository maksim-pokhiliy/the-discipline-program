import CheckCircle from "@mui/icons-material/CheckCircle";
import { Stack } from "@mui/material";

import { ContentSection } from "@repo/ui";

const HERO_TITLE = "Payment Successful!";
const HERO_SUBTITLE = "Welcome to The Discipline Program! Your transformation journey begins now.";

export const PaymentSuccessHeroSection = () => {
  return (
    <ContentSection title={HERO_TITLE} subtitle={HERO_SUBTITLE}>
      <Stack sx={{ alignItems: "center" }}>
        <Stack
          sx={(theme) => ({
            width: theme.spacing(15),
            height: theme.spacing(15),
            borderRadius: "50%",
            backgroundColor: "success.main",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <CheckCircle sx={(theme) => ({ fontSize: theme.spacing(10), color: "common.white" })} />
        </Stack>
      </Stack>
    </ContentSection>
  );
};
