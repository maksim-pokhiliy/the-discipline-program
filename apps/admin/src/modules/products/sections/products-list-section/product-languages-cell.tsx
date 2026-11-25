import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";

import { type ProductLanguageState } from "@repo/contracts/cms/product";

import { TranslationStateChip } from "@app/lib/components/localized-editor/translation-state";

type ProductLanguagesCellProps = { translations: readonly ProductLanguageState[] };

export const ProductLanguagesCell = ({ translations }: ProductLanguagesCellProps): ReactElement =>
  translations.length === 0 ? (
    <Typography variant="caption" color="text.secondary">
      English only
    </Typography>
  ) : (
    <Stack spacing={1}>
      {translations.map(({ locale, name, state }) => (
        <Stack
          key={locale}
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
            {name}
          </Typography>
          <TranslationStateChip state={state} />
        </Stack>
      ))}
    </Stack>
  );
