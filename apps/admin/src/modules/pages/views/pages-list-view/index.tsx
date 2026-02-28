"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { usePagesListData } from "@app/lib/hooks/use-pages";

import { PagesListSection } from "../../sections/pages-list-section";

export const PagesListView = () => (
  <AdminListView queryResult={usePagesListData()} loadingMessage="Loading pages...">
    {(pages) => <PagesListSection pages={pages} />}
  </AdminListView>
);
