"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { usePagesListData } from "@app/lib/hooks";

import { PagesListSection } from "../../sections";

export const PagesListView = () => (
  <AdminListView
    queryResult={usePagesListData()}
    loadingMessage="Loading pages..."
    title="Pages"
    subtitle="Edit content and sections for marketing site pages"
  >
    {(pages) => <PagesListSection pages={pages} />}
  </AdminListView>
);
