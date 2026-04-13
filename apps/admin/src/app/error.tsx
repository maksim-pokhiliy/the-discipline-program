"use client";

import { Button, Stack, Typography } from "@mui/material";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ error, reset }: ErrorPageProps) => (
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
        Go to dashboard
      </Button>
    </Stack>
  </Stack>
);

export default ErrorPage;
