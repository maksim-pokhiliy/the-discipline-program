"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useLabelsPageData } from "@app/lib/hooks";

import { LabelsListSection } from "../../sections";

export const LabelsListView = () => (
  <AdminListView
    queryResult={useLabelsPageData()}
    loadingMessage="Loading labels..."
    title="Labels"
    subtitle="Coach library of plan structure labels"
  >
    {(data) => <LabelsListSection labels={data.labels} />}
  </AdminListView>
);
