import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";

type EnglishReferenceProps = { id: string; text: string };

export const EnglishReference = ({ id, text }: EnglishReferenceProps): ReactElement => (
  <Stack id={id} spacing={1}>
    <Typography variant="caption" color="text.secondary">
      English
    </Typography>
    <Typography
      variant="body2"
      color={text ? "text.primary" : "text.disabled"}
      sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
    >
      {text || "No English text"}
    </Typography>
  </Stack>
);
