"use client";

import { type AdminContactsPageData } from "@repo/contracts/contact";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useContactsPageData } from "@app/lib/hooks";

import { ContactsListSection } from "../../sections";

interface ContactsListViewProps {
  initialData: AdminContactsPageData;
}

export const ContactsListView = ({ initialData }: ContactsListViewProps) => (
  <AdminListView
    queryResult={useContactsPageData({ initialData })}
    loadingMessage="Loading contacts..."
  >
    {(data) => <ContactsListSection contacts={data.contacts} />}
  </AdminListView>
);
