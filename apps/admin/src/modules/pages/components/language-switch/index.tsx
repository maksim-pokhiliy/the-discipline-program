"use client";

import { type ReactElement } from "react";

import { Chip, MenuItem, Stack, TextField } from "@mui/material";

import { type AdminLocaleListItem, type LocaleCode } from "@repo/contracts/cms/locale";

import { type EditorLocale } from "../locale-gate";

type LanguageSwitchProps = {
  locale: EditorLocale;
  catalog: readonly AdminLocaleListItem[] | undefined;
  onChange: (code: LocaleCode) => void;
};

export const LanguageSwitch = ({
  locale,
  catalog,
  onChange,
}: LanguageSwitchProps): ReactElement => (
  <TextField
    select
    label="Language"
    size="small"
    value={locale.code}
    onChange={(event) => onChange(event.target.value)}
    sx={{ minWidth: "12rem" }}
  >
    {(catalog ?? [locale]).map((language) => (
      <MenuItem key={language.code} value={language.code}>
        <Stack direction="row" spacing={1} alignItems="center">
          <span>{language.name}</span>
          {language.isDefault && <Chip label="Default" size="small" variant="outlined" />}
          {!language.isEnabled && <Chip label="Hidden from site" size="small" variant="outlined" />}
        </Stack>
      </MenuItem>
    ))}
  </TextField>
);
