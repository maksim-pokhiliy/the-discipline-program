"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useBlockTypesPageData } from "@app/lib/hooks";

import { BlockTypesListSection } from "../../sections";

export const BlockTypesListView = () => (
  <AdminListView
    queryResult={useBlockTypesPageData()}
    loadingMessage="Loading block types..."
    title="Block Types"
    subtitle="Manage block categories available to plans"
  >
    {(data) => <BlockTypesListSection blockTypes={data.blockTypes} />}
  </AdminListView>
);
