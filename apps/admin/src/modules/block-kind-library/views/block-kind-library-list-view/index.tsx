"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useBlockKindsPageData } from "@app/lib/hooks";

import { BlockKindLibraryListSection } from "../../sections";

export const BlockKindLibraryListView = () => (
  <AdminListView
    queryResult={useBlockKindsPageData()}
    loadingMessage="Loading block kinds..."
    title="Block kinds"
    subtitle="System-wide and coach-owned block kind definitions"
  >
    {(data) => <BlockKindLibraryListSection items={data.items} />}
  </AdminListView>
);
