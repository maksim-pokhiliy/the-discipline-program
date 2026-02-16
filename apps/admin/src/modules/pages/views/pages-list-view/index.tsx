"use client";

import { type AdminPageListItem } from "@repo/contracts/pages";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { usePagesListData } from "@app/lib/hooks/use-pages";

import { PagesListSection } from "../../sections/pages-list-section";

interface PagesListViewProps {
  initialData: AdminPageListItem[];
}

export const PagesListView = ({ initialData }: PagesListViewProps) => (
  <AdminListView queryResult={usePagesListData({ initialData })} loadingMessage="Loading pages...">
    {(pages) => <PagesListSection pages={pages} />}
  </AdminListView>
);
