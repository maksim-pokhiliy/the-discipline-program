import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";

interface PaymentPageWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export const SuspenseWrapper = ({
  children,
  loadingMessage = "Loading...",
}: PaymentPageWrapperProps) => {
  return (
    <Suspense
      fallback={
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
          spacing={2}
        >
          <CircularProgress size={20} />

          <Typography variant="body1">{loadingMessage}</Typography>
        </Stack>
      }
    >
      {children}
    </Suspense>
  );
};
