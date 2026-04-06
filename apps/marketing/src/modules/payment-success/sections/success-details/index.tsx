import { Card, CardContent, Stack, Typography } from "@mui/material";

// import { PaymentOrder } from "@repo/api-client";
import { ContentSection } from "@repo/ui";

// interface PaymentSuccessDetailsSectionProps {
//   order: PaymentOrder;
// }

export const PaymentSuccessDetailsSection = () => {
  // export const PaymentSuccessDetailsSection = ({ order }: PaymentSuccessDetailsSectionProps) => {
  return (
    <ContentSection title="Order Details" maxWidth="md">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Program:</Typography>

                <Typography variant="h6">{"order.programName"}</Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Amount:</Typography>

                <Typography variant="h6" sx={{ color: "primary.main" }}>
                  ${"order.amount"} {"order.currency"}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Email:</Typography>

                <Typography>{"order.customerEmail"}</Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Order ID:</Typography>

                <Typography
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {"order.id"}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Status:</Typography>

                <Typography
                  sx={{
                    color: "success.main",
                    textTransform: "capitalize",
                  }}
                >
                  {"order.status"}
                </Typography>
              </Stack>

              {/* {order.completedAt && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Completed:</Typography>

                  <Typography >
                    {new Date(order.completedAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              )} */}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </ContentSection>
  );
};
