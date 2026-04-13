"use client";

import { Button, Stack, Typography } from "@mui/material";

export type ErrorPageContentProps = {
  error: Error & { digest?: string };
  reset: () => void;
  homeLabel?: string;
};

export const ErrorPageContent = ({
  error,
  reset,
  homeLabel = "Go home",
}: ErrorPageContentProps) => (
  <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "60vh", py: 4 }}>
    <Typography variant="display2" color="error.main">
      Error
    </Typography>

    <Typography variant="h4" color="text.secondary" sx={{ mt: 2 }}>
      Something went wrong
    </Typography>

    {error.digest && (
      <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
        Error ID: {error.digest}
      </Typography>
    )}

    <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
      <Button variant="contained" onClick={reset}>
        Try again
      </Button>

      <Button variant="outlined" href="/">
        {homeLabel}
      </Button>
    </Stack>
  </Stack>
);
