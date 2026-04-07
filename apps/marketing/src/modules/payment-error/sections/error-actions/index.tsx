import { Button, Stack, Typography } from "@mui/material";

import { ContentSection } from "@repo/ui";

export const PaymentErrorActionsSection = () => {
  return (
    <ContentSection title="What Can You Do?" subtitle="Here are some options to resolve the issue">
      <Stack spacing={6} alignItems="center">
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <Button
            variant="contained"
            size="large"
            href="/storefront"
            sx={(theme) => ({ minWidth: theme.spacing(25) })}
          >
            Try Again
          </Button>

          <Button size="large" href="/contact" sx={(theme) => ({ minWidth: theme.spacing(25) })}>
            Contact Support
          </Button>
        </Stack>

        <Stack spacing={2} textAlign="center" sx={(theme) => ({ maxWidth: theme.spacing(62.5) })}>
          <Typography variant="body1" color="text.secondary">
            <strong>Before trying again:</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            1. Verify your card details are correct
            <br />
            2. Ensure you have sufficient funds
            <br />
            3. Check if your card is enabled for online payments
            <br />
            4. Try using a different payment method
          </Typography>

          <Typography variant="caption" color="text.disabled">
            If the problem persists, please contact our support team. We&apos;re here to help you
            get started with your fitness journey.
          </Typography>
        </Stack>
      </Stack>
    </ContentSection>
  );
};
