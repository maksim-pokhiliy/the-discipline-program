"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useSessionTemplatesPageData } from "@app/lib/hooks";

import { SessionTemplateLibraryListSection } from "../../sections";

export const SessionTemplateLibraryListView = () => (
  <AdminListView
    queryResult={useSessionTemplatesPageData()}
    loadingMessage="Loading session templates..."
    title="Session templates"
    subtitle="System-wide and coach-owned session templates"
  >
    {(data) => <SessionTemplateLibraryListSection items={data.items} />}
  </AdminListView>
);
