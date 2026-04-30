"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export const BlockTemplateLibraryCreateView = () => (
  <Stack spacing={3}>
    <Stack spacing={1}>
      <Typography variant="h5">Create block template</Typography>
      <Typography variant="body2" color="text.secondary">
        Block templates capture a snapshot of an existing block (segments + set groups + entries).
      </Typography>
    </Stack>

    <Alert severity="info">
      Block templates are authored from the platform plan editor. Select a block on the canvas and
      press <strong>Cmd+Shift+S</strong> to save it as a template. Admins manage existing templates
      from this list (edit metadata, promote / demote, delete).
    </Alert>

    <Stack direction="row" spacing={2}>
      <Button component={Link} href="/library/block-templates" variant="outlined">
        Back to Block templates
      </Button>
    </Stack>
  </Stack>
);
