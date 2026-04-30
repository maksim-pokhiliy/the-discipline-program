"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useWeekTemplatesPageData } from "@app/lib/hooks";

import { WeekTemplateLibraryListSection } from "../../sections";

export const WeekTemplateLibraryListView = () => (
  <AdminListView
    queryResult={useWeekTemplatesPageData()}
    loadingMessage="Loading week templates..."
    title="Week templates"
    subtitle="System-wide and coach-owned week templates"
  >
    {(data) => <WeekTemplateLibraryListSection items={data.items} />}
  </AdminListView>
);
