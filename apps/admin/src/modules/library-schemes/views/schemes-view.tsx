"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useLibrarySchemes } from "@app/lib/hooks";

import { SchemesListSection } from "../sections";

export const SchemesView = () => (
  <AdminListView
    queryResult={useLibrarySchemes()}
    loadingMessage="Loading schemes..."
    title="Schemes"
    subtitle="Programming schemes (STRAIGHT_SETS, FOR_TIME, AMRAP, etc.)"
  >
    {(data) => <SchemesListSection schemes={data} />}
  </AdminListView>
);
