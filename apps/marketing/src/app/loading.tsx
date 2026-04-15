"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";

const Loading = () => (
  <Stack>
    <Box sx={(theme) => ({ ...theme.mixins.toolbar })} />

    <Stack direction="row" justifyContent="center" alignItems="center" minHeight="20vh" spacing={2}>
      <CircularProgress size={20} />
      <Typography variant="body1">Loading page...</Typography>
    </Stack>
  </Stack>
);

export default Loading;
