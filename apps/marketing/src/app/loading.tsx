import { CircularProgress, Stack } from "@mui/material";

export default function Loading() {
  return (
    <Stack justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Stack>
  );
}
