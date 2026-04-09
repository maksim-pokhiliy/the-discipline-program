"use client";

import { Alert, Typography } from "@mui/material";

import { LoadingState } from "./loading-state";

export type QueryWrapperProps<TData> = {
  isLoading: boolean;
  error: Error | null;
  data: TData | undefined;
  children: (data: TData) => React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noDataMessage?: string;
};

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
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }

  if (!data) {
    return (
      <Typography variant="body1" textAlign="center">
        {noDataMessage}
      </Typography>
    );
  }

  return children(data);
};
