import { Button, Stack, Typography } from "@mui/material";

import { ContentSection } from "@repo/ui";

export const PaymentSuccessActionsSection = () => {
  return (
    <ContentSection
      title="What's Next?"
      subtitle="You will receive access instructions via email shortly"
      backgroundColor="dark"
    >
      <Stack spacing={6} alignItems="center">
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <Button variant="contained" size="large" href="/contact" sx={{ minWidth: 200 }}>
            Contact Support
          </Button>

          <Button variant="outlined" size="large" href="/" sx={{ minWidth: 200 }}>
            Back to Home
          </Button>
        </Stack>

        <Stack spacing={2} textAlign="center" sx={{ maxWidth: 500 }}>
          <Typography variant="body1" color="text.secondary">
            <strong>Next Steps:</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            1. Check your email for access instructions
            <br />
            2. Download the mobile app or access the web platform
            <br />
            3. Start your first workout with Denis Sergeev
            <br />
            4. Join our community and track your progress
          </Typography>

          <Typography variant="caption" color="text.disabled">
            If you don&apos;t receive an email within 15 minutes, please check your spam folder or
            contact our support team.
          </Typography>
        </Stack>
      </Stack>
    </ContentSection>
  );
};
