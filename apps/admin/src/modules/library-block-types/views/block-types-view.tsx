"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useLibraryBlockTypes } from "@app/lib/hooks";

import { BlockTypesListSection } from "../sections";

export const BlockTypesView = () => (
  <AdminListView
    queryResult={useLibraryBlockTypes()}
    loadingMessage="Loading block types..."
    title="Block types"
    subtitle="Categories used to group workout blocks (Warm-up, Strength, etc.)"
  >
    {(data) => <BlockTypesListSection blockTypes={data} />}
  </AdminListView>
);
