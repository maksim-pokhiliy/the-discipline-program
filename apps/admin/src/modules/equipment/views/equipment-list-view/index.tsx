"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useEquipmentPageData } from "@app/lib/hooks";

import { EquipmentListSection } from "../../sections";

export const EquipmentListView = () => (
  <AdminListView
    queryResult={useEquipmentPageData()}
    loadingMessage="Loading equipment..."
    title="Equipment"
    subtitle="Coach library of training implements"
  >
    {(data) => <EquipmentListSection equipment={data.equipment} />}
  </AdminListView>
);
