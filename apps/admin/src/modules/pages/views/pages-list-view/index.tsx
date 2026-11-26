"use client";

import { type ReactElement, Suspense } from "react";

import { LocaleGate } from "@app/lib/components/localized-editor/locale-gate";

import { PagesListContent } from "./pages-list-content";

export const PagesListView = (): ReactElement => (
  <Suspense>
    <LocaleGate>{(locale) => <PagesListContent locale={locale} />}</LocaleGate>
  </Suspense>
);
