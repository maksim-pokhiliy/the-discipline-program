"use client";

import { Alert, AlertTitle, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export const WeekTemplateLibraryCreateView = () => (
  <Stack spacing={3}>
    <Stack spacing={1}>
      <Typography variant="h5">Create week template</Typography>
      <Typography variant="body2" color="text.secondary">
        Week templates capture a snapshot of an entire week (days + sessions + blocks).
      </Typography>
    </Stack>

    <Alert severity="info">
      <AlertTitle>Authoring path: platform plan editor</AlertTitle>
      Week templates aggregate up to seven days of nested sessions and blocks, so they are authored
      on the platform plan editor. Open any plan, select a week, and press
      <strong> Cmd+Shift+S</strong> to save it as a template at SYSTEM or COACH scope.
    </Alert>

    <Alert severity="warning">
      <AlertTitle>Admin standalone authoring not supported</AlertTitle>
      The admin console intentionally does not provide a from-scratch week builder. To curate a
      SYSTEM-scope template, save the source from the platform editor as COACH first, then promote
      it to SYSTEM from this list. Block templates do support standalone admin creation.
    </Alert>

    <Stack direction="row" spacing={2}>
      <Button component={Link} href="/library/week-templates" variant="outlined">
        Back to Week templates
      </Button>
      <Button component={Link} href="/library/block-templates/create" variant="contained">
        Create a block template instead
      </Button>
    </Stack>
  </Stack>
);
