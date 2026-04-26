"use client";

import { Alert } from "@mui/material";

import { type SchemeFormNoneProps } from "./scheme-form.types";

export const SchemeFormNone = (_props: SchemeFormNoneProps) => (
  <Alert severity="info" variant="outlined">
    No scheme parameters — segment runs as a single block of work.
  </Alert>
);
