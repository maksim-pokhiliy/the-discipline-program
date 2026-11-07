import { type ReactElement } from "react";

import { Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

import { languageEditPath } from "../constants";

type LanguageNameCellProps = { language: AdminLocaleListItem };

export const LanguageNameCell = ({ language }: LanguageNameCellProps): ReactElement => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography
      component={Link}
      href={languageEditPath(language.code)}
      variant="subtitle2"
      color="primary"
      sx={{ textDecoration: "none" }}
    >
      {language.name}
    </Typography>
    {language.isDefault && <Chip label="Default" size="small" />}
  </Stack>
);
