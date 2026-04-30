"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
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
      Week templates are authored from the platform plan editor. Select a week on the canvas and
      press <strong>Cmd+Shift+S</strong> to save it as a template. Admins manage existing templates
      from this list (edit metadata, promote / demote, delete).
    </Alert>

    <Stack direction="row" spacing={2}>
      <Button component={Link} href="/library/week-templates" variant="outlined">
        Back to Week templates
      </Button>
    </Stack>
  </Stack>
);
