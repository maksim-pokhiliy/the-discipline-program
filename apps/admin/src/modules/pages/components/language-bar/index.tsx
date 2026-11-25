"use client";

import { type ReactElement } from "react";

import { EditorLanguageBar } from "@app/lib/components/localized-editor/editor-language-bar";
import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";

import { LanguageBanner } from "../language-banner";

type LanguageBarProps = { locale: EditorLocale };

export const LanguageBar = ({ locale }: LanguageBarProps): ReactElement => (
  <EditorLanguageBar locale={locale}>
    <LanguageBanner locale={locale} />
  </EditorLanguageBar>
);
