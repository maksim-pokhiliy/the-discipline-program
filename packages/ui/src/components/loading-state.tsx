import { CircularProgress, Stack, Typography } from "@mui/material";

type LoadingStateProps = {
  message?: string;
  minHeight?: string;
};

export const LoadingState = ({ message = "Loading...", minHeight = "20vh" }: LoadingStateProps) => {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
      spacing={2}
    >
      <CircularProgress size={20} />
      <Typography variant="body1">{message}</Typography>
    </Stack>
  );
};
