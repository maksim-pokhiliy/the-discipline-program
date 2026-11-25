import { type ReactElement } from "react";

import { Alert, AlertTitle, Chip, Stack, Typography } from "@mui/material";

import { type EditorLocale } from "../locale-gate";

type EditorLanguageBannerProps = {
  locale: EditorLocale;
  englishNote: string;
  translationNotes: readonly string[];
};

export const EditorLanguageBanner = ({
  locale,
  englishNote,
  translationNotes,
}: EditorLanguageBannerProps): ReactElement => (
  <Alert severity="info" sx={{ width: "100%" }}>
    <AlertTitle>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <span>Editing {locale.name}</span>
        {!locale.isEnabled && <Chip label="Hidden from site" size="small" variant="outlined" />}
      </Stack>
    </AlertTitle>
    <Stack spacing={1}>
      {locale.isDefault ? (
        <Typography variant="body2">{englishNote}</Typography>
      ) : (
        translationNotes.map((note) => (
          <Typography key={note} variant="body2">
            {note}
          </Typography>
        ))
      )}
      {!locale.isEnabled && (
        <Typography variant="body2">
          {locale.name} is hidden from the site until you enable it on the Languages page.
        </Typography>
      )}
    </Stack>
  </Alert>
);
