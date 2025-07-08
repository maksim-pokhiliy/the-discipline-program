import { CircularProgress, Typography, Stack } from "@mui/material";

interface QueryWrapperProps<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | undefined;
  children: (data: T) => React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noDataMessage?: string;
}

export const QueryWrapper = <T,>({
  isLoading,
  error,
  data,
  children,
  loadingMessage = "Loading...",
  errorMessage = "Failed to load data",
  noDataMessage = "No data available",
}: QueryWrapperProps<T>) => {
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

        {loadingMessage && <Typography variant="body1">{loadingMessage}</Typography>}
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

  return <>{children(data)}</>;
};
