import { CheckCircle } from "@mui/icons-material";
import { alpha, Box, Stack } from "@mui/material";

import { ContentSection } from "@app/shared/components/ui/content-section";

export const PaymentSuccessHeroSection = () => {
  return (
    <ContentSection
      title="Payment Successful!"
      subtitle="Welcome to The Discipline Program! Your transformation journey begins now."
      backgroundColor="dark"
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          sx={(theme) => ({
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: "success.main",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 32px ${alpha(theme.palette.success.light, 0.4)}`,
          })}
        >
          <CheckCircle sx={{ fontSize: 80, color: "white" }} />
        </Stack>
      </Box>
    </ContentSection>
  );
};
