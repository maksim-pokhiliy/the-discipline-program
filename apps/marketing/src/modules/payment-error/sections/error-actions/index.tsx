import { Button, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { ContentSection } from "@repo/ui";

const TROUBLESHOOT_STEPS = [
  "1. Verify your card details are correct",
  "2. Ensure you have sufficient funds",
  "3. Check if your card is enabled for online payments",
  "4. Try using a different payment method",
];

const PERSIST_NOTICE =
  "If the problem persists, please contact our support team. We're here to help you get started with your fitness journey.";

export const PaymentErrorActionsSection = () => {
  return (
    <ContentSection title="What Can You Do?" subtitle="Here are some options to resolve the issue">
      <Stack spacing={6} alignItems="center">
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <Button variant="contained" size="large" component={Link} href="/storefront">
            Try Again
          </Button>

          <Button size="large" component={Link} href="/contact">
            Contact Support
          </Button>
        </Stack>

        <Stack spacing={2} textAlign="center" sx={(theme) => ({ maxWidth: theme.spacing(62.5) })}>
          <Typography variant="subtitle2" color="text.secondary">
            Before trying again:
          </Typography>

          <List dense disablePadding>
            {TROUBLESHOOT_STEPS.map((step) => (
              <ListItem key={step} disableGutters disablePadding>
                <ListItemText secondary={step} />
              </ListItem>
            ))}
          </List>

          <Typography variant="caption" color="text.disabled">
            {PERSIST_NOTICE}
          </Typography>
        </Stack>
      </Stack>
    </ContentSection>
  );
};
