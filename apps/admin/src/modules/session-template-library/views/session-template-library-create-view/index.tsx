"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export const SessionTemplateLibraryCreateView = () => (
  <Stack spacing={3}>
    <Stack spacing={1}>
      <Typography variant="h5">Create session template</Typography>
      <Typography variant="body2" color="text.secondary">
        Session templates capture a snapshot of an existing session (blocks + segments + entries).
      </Typography>
    </Stack>

    <Alert severity="info">
      Session templates are authored from the platform plan editor. Select a session on the canvas
      and press <strong>Cmd+Shift+S</strong> to save it as a template. Admins manage existing
      templates from this list (edit metadata, promote / demote, delete).
    </Alert>

    <Stack direction="row" spacing={2}>
      <Button component={Link} href="/library/session-templates" variant="outlined">
        Back to Session templates
      </Button>
    </Stack>
  </Stack>
);
