"use client";

import { type ReactElement } from "react";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { type EditorLocale } from "@app/lib/components/localized-editor/locale-gate";
import { usePagesListData } from "@app/lib/hooks";

import { PagesListSection } from "../../sections";

type PagesListContentProps = { locale: EditorLocale };

export const PagesListContent = ({ locale }: PagesListContentProps): ReactElement => (
  <AdminListView
    queryResult={usePagesListData(locale.code)}
    loadingMessage="Loading pages..."
    title="Pages"
    subtitle="Edit content and sections for marketing site pages"
  >
    {(pages) => <PagesListSection pages={pages} locale={locale} />}
  </AdminListView>
);
