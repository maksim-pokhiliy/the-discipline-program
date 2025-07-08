import { Stack, Typography, Card, CardContent, Alert } from "@mui/material";

import { ContentSection } from "@app/shared/components/ui/content-section";

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
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {error}
              </Typography>
            </Alert>

            {orderId && (
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Transaction Details
                </Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Order ID:</Typography>

                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      color: "text.secondary",
                    }}
                  >
                    {orderId}
                  </Typography>
                </Stack>
              </Stack>
            )}

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                <strong>Common reasons for payment failure:</strong>
              </Typography>

              <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                <li>Insufficient funds on your card</li>
                <li>Incorrect card details (number, expiry, or CVV)</li>
                <li>Card expired or blocked</li>
                <li>Network or technical issues</li>
                <li>Bank security restrictions</li>
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </ContentSection>
  );
};
