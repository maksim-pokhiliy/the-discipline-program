import { type ReactElement } from "react";

import { Typography } from "@mui/material";

import { marketingPagePath, PageSlug } from "@repo/contracts/cms/pages";

type LanguagePathCellProps = { code: string };

export const LanguagePathCell = ({ code }: LanguagePathCellProps): ReactElement => (
  <Typography variant="caption" color="text.secondary">
    {marketingPagePath(PageSlug.HOME, code)}
  </Typography>
);
