"use client";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { usePagesListData } from "@app/lib/hooks";

import { PagesListSection } from "../../sections";

export const PagesListView = () => (
  <AdminListView
    queryResult={usePagesListData(DEFAULT_LOCALE_CODE)}
    loadingMessage="Loading pages..."
    title="Pages"
    subtitle="Edit content and sections for marketing site pages"
  >
    {(pages) => <PagesListSection pages={pages} />}
  </AdminListView>
);
