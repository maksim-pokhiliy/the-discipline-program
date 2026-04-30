"use client";

import { Alert, AlertTitle, Button, Stack, Typography } from "@mui/material";
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
      <AlertTitle>Authoring path: platform plan editor</AlertTitle>
      Session templates are large composite trees and are best authored on the platform plan editor.
      Open any plan, select a session, and press <strong>Cmd+Shift+S</strong> to save it as a
      template at SYSTEM or COACH scope.
    </Alert>

    <Alert severity="warning">
      <AlertTitle>Admin standalone authoring not supported</AlertTitle>
      The admin console intentionally does not provide a from-scratch session builder. To curate a
      SYSTEM-scope template, save the source from the platform editor as COACH first, then promote
      it to SYSTEM from this list. Block templates do support standalone admin creation.
    </Alert>

    <Stack direction="row" spacing={2}>
      <Button component={Link} href="/library/session-templates" variant="outlined">
        Back to Session templates
      </Button>
      <Button component={Link} href="/library/block-templates/create" variant="contained">
        Create a block template instead
      </Button>
    </Stack>
  </Stack>
);
