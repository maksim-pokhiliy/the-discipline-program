"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useContactsPageData } from "@app/lib/hooks";

import { ContactsListSection } from "../../sections";

export const ContactsListView = () => (
  <AdminListView queryResult={useContactsPageData()} loadingMessage="Loading contacts...">
    {(data) => <ContactsListSection contacts={data.contacts} />}
  </AdminListView>
);
