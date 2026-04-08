import { Button, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { ContentSection } from "@repo/ui";

const NEXT_STEPS = [
  "1. Check your email for access instructions",
  "2. Download the mobile app or access the web platform",
  "3. Start your first workout with Denis Sergeev",
  "4. Join our community and track your progress",
];

const SPAM_NOTICE =
  "If you don't receive an email within 15 minutes, please check your spam folder or contact our support team.";

export const PaymentSuccessActionsSection = () => {
  return (
    <ContentSection
      title="What's Next?"
      subtitle="You will receive access instructions via email shortly"
    >
      <Stack spacing={6} alignItems="center">
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <Button variant="contained" size="large" component={Link} href="/contact">
            Contact Support
          </Button>

          <Button size="large" component={Link} href="/">
            Back to Home
          </Button>
        </Stack>

        <Stack spacing={2} textAlign="center" sx={(theme) => ({ maxWidth: theme.spacing(62.5) })}>
          <Typography variant="subtitle2" color="text.secondary">
            Next Steps:
          </Typography>

          <List dense disablePadding>
            {NEXT_STEPS.map((step) => (
              <ListItem key={step} disableGutters disablePadding>
                <ListItemText secondary={step} />
              </ListItem>
            ))}
          </List>

          <Typography variant="caption" color="text.disabled">
            {SPAM_NOTICE}
          </Typography>
        </Stack>
      </Stack>
    </ContentSection>
  );
};
