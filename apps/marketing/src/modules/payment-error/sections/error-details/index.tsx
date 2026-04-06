import {
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { ContentSection } from "@repo/ui";

interface PaymentErrorDetailsSectionProps {
  error: string;
  orderId: string | null;
}

export const PaymentErrorDetailsSection = ({ error, orderId }: PaymentErrorDetailsSectionProps) => {
  return (
    <ContentSection title="Error Details" maxWidth="md">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Alert severity="error">
              <Typography variant="body1">{error}</Typography>
            </Alert>

            {orderId && (
              <Stack spacing={2}>
                <Typography variant="h6">Transaction Details</Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Order ID:</Typography>

                  <Typography sx={{ color: "text.secondary" }}>{orderId}</Typography>
                </Stack>
              </Stack>
            )}

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                <strong>Common reasons for payment failure:</strong>
              </Typography>

              <List dense disablePadding sx={{ pl: 2 }}>
                <ListItem disableGutters disablePadding>
                  <ListItemText secondary="Insufficient funds on your card" />
                </ListItem>
                <ListItem disableGutters disablePadding>
                  <ListItemText secondary="Incorrect card details (number, expiry, or CVV)" />
                </ListItem>
                <ListItem disableGutters disablePadding>
                  <ListItemText secondary="Card expired or blocked" />
                </ListItem>
                <ListItem disableGutters disablePadding>
                  <ListItemText secondary="Network or technical issues" />
                </ListItem>
                <ListItem disableGutters disablePadding>
                  <ListItemText secondary="Bank security restrictions" />
                </ListItem>
              </List>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </ContentSection>
  );
};
