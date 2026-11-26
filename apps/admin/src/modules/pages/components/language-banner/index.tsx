import { type ReactElement } from "react";

import { EditorLanguageBanner } from "@app/lib/components/localized-editor/editor-language-banner";
import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";

type LanguageBannerProps = { locale: EditorLocale };

export const LanguageBanner = ({ locale }: LanguageBannerProps): ReactElement => (
  <EditorLanguageBanner
    locale={locale}
    englishNote="English is the default language: every other language falls back to it, section by section."
    translationNotes={[
      "Each field shows its English text beside it. Links, images and list rows always come from English.",
      `A section goes live in ${locale.name} once every English text in it has a translation. Until then it is saved as a draft that the site does not show.`,
    ]}
  />
);
