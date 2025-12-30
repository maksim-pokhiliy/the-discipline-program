"use client";

import { CircularProgress, Stack, Typography } from "@mui/material";

interface QueryWrapperProps<TData> {
  isLoading: boolean;
  error: Error | null;
  data: TData | undefined;
  children: (data: TData) => React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noDataMessage?: string;
}

export const QueryWrapper = <TData,>({
  isLoading,
  error,
  data,
  children,
  loadingMessage = "Loading...",
  errorMessage = "Failed to load data",
  noDataMessage = "No data available",
}: QueryWrapperProps<TData>) => {
  if (isLoading) {
    return (
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        minHeight="20vh"
        spacing={2}
      >
        <CircularProgress size={20} />
        <Typography variant="body1">{loadingMessage}</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Typography variant="h4" color="error" textAlign="center">
        {errorMessage}
      </Typography>
    );
  }

  if (!data) {
    return (
      <Typography variant="h4" textAlign="center">
        {noDataMessage}
      </Typography>
    );
  }

  return children(data);
};
