"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useSchemeTemplatesPageData } from "@app/lib/hooks";

import { SchemeTemplateLibraryListSection } from "../../sections";

export const SchemeTemplateLibraryListView = () => (
  <AdminListView
    queryResult={useSchemeTemplatesPageData()}
    loadingMessage="Loading scheme templates..."
    title="Scheme templates"
    subtitle="System-wide and coach-owned scheme templates"
  >
    {(data) => <SchemeTemplateLibraryListSection items={data.items} />}
  </AdminListView>
);
