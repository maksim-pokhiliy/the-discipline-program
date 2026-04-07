import { Box, CircularProgress, Stack, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Stack>
      <Box sx={(theme) => ({ ...theme.mixins.toolbar })} />

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        minHeight="20vh"
        spacing={2}
      >
        <CircularProgress size={20} />
        <Typography variant="body1">Loading page...</Typography>
      </Stack>
    </Stack>
  );
}
