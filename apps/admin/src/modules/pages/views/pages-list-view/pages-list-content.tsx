"use client";

import { type ReactElement } from "react";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { usePagesListData } from "@app/lib/hooks";

import { type EditorLocale } from "../../components/locale-gate";
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
