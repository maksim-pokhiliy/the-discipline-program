import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { Stack } from "@mui/material";

import { ContentSection } from "@repo/ui";

export const PaymentErrorHeroSection = () => {
  return (
    <ContentSection
      title="Payment Failed"
      subtitle="There was an issue processing your payment. Don't worry, no charges were made to your account."
    >
      <Stack sx={{ alignItems: "center" }}>
        <Stack
          sx={(theme) => ({
            width: theme.spacing(15),
            height: theme.spacing(15),
            borderRadius: "50%",
            backgroundColor: "error.main",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <ErrorOutline sx={(theme) => ({ fontSize: theme.spacing(10), color: "common.white" })} />
        </Stack>
      </Stack>
    </ContentSection>
  );
};
