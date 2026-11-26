import { type ReactElement } from "react";

import { EditorLanguageBanner } from "@app/lib/components/localized-editor/editor-language-banner";
import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";

type ProductLanguageBannerProps = { locale: EditorLocale };

export const ProductLanguageBanner = ({ locale }: ProductLanguageBannerProps): ReactElement => (
  <EditorLanguageBanner
    locale={locale}
    englishNote="English is the default language: every other language falls back to it, product by product."
    translationNotes={[
      "Each field shows its English text beside it. The photo, the price, the URL slug and the visibility always come from English, and features are added, moved and removed in English.",
      `This product goes live in ${locale.name} once every English text in it has a translation. Until then it is saved as a draft that the site does not show.`,
    ]}
  />
);
