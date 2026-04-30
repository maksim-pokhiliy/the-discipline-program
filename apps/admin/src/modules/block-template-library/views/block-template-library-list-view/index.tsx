"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useBlockTemplatesPageData } from "@app/lib/hooks";

import { BlockTemplateLibraryListSection } from "../../sections";

export const BlockTemplateLibraryListView = () => (
  <AdminListView
    queryResult={useBlockTemplatesPageData()}
    loadingMessage="Loading block templates..."
    title="Block templates"
    subtitle="System-wide and coach-owned block templates"
  >
    {(data) => <BlockTemplateLibraryListSection items={data.items} />}
  </AdminListView>
);
