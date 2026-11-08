import { type ReactElement } from "react";

import { Alert, AlertTitle, Chip, Stack, Typography } from "@mui/material";

import { type EditorLocale } from "../locale-gate";

type LanguageBannerProps = { locale: EditorLocale };

export const LanguageBanner = ({ locale }: LanguageBannerProps): ReactElement => (
  <Alert severity="info" sx={{ flex: 1 }}>
    <AlertTitle>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <span>Editing {locale.name}</span>
        {!locale.isEnabled && <Chip label="Hidden from site" size="small" variant="outlined" />}
      </Stack>
    </AlertTitle>
    <Stack spacing={1}>
      {locale.isDefault ? (
        <Typography variant="body2">
          English is the default language: every other language falls back to it, section by
          section.
        </Typography>
      ) : (
        <>
          <Typography variant="body2">
            Links, images and list rows always come from English.
          </Typography>
          <Typography variant="body2">
            A section goes live in {locale.name} once every English text in it has a translation.
            Until then it is saved as a draft that the site does not show.
          </Typography>
        </>
      )}
      {!locale.isEnabled && (
        <Typography variant="body2">
          {locale.name} is hidden from the site until you enable it on the Languages page.
        </Typography>
      )}
    </Stack>
  </Alert>
);
