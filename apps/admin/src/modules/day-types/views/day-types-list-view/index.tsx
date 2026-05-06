"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useDayTypesPageData } from "@app/lib/hooks";

import { DayTypesListSection } from "../../sections";

export const DayTypesListView = () => (
  <AdminListView
    queryResult={useDayTypesPageData()}
    loadingMessage="Loading day types..."
    title="Day Types"
    subtitle="Manage day categories available to plans"
  >
    {(data) => <DayTypesListSection dayTypes={data.dayTypes} />}
  </AdminListView>
);
