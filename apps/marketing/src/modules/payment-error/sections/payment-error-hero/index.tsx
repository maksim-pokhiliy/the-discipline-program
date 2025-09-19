import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { alpha, Box, Stack } from "@mui/material";

import { ContentSection } from "@app/shared/components/ui";

export const PaymentErrorHeroSection = () => {
  return (
    <ContentSection
      title="Payment Failed"
      subtitle="There was an issue processing your payment. Don't worry, no charges were made to your account."
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
            backgroundColor: "error.main",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 32px ${alpha(theme.palette.error.light, 0.4)}`,
          })}
        >
          <ErrorOutline sx={{ fontSize: 80, color: "white" }} />
        </Stack>
      </Box>
    </ContentSection>
  );
};
