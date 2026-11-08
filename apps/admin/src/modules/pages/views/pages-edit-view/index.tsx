"use client";

import { Suspense } from "react";

import { LocaleGate } from "../../components/locale-gate";

import { PagesEditContent } from "./pages-edit-content";

type PagesEditViewProps = {
  slug: string;
};

export const PagesEditView: React.FC<PagesEditViewProps> = ({ slug }) => (
  <Suspense>
    <LocaleGate>{(locale) => <PagesEditContent slug={slug} locale={locale} />}</LocaleGate>
  </Suspense>
);
