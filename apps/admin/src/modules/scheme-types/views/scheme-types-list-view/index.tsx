"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useSchemeTypesPageData } from "@app/lib/hooks";

import { SchemeTypesListSection } from "../../sections";

export const SchemeTypesListView = () => (
  <AdminListView
    queryResult={useSchemeTypesPageData()}
    loadingMessage="Loading scheme types..."
    title="Scheme Types"
    subtitle="Manage scheme archetypes and default params available to plans"
  >
    {(data) => <SchemeTypesListSection schemeTypes={data.schemeTypes} />}
  </AdminListView>
);
