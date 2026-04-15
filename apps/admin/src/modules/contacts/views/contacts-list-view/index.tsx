"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useContactsPageData } from "@app/lib/hooks";

import { ContactsListSection } from "../../sections";

export const ContactsListView = () => (
  <AdminListView
    queryResult={useContactsPageData()}
    loadingMessage="Loading contacts..."
    title="Contacts"
    subtitle="Review and manage form submissions from the website"
  >
    {(data) => <ContactsListSection contacts={data.contacts} />}
  </AdminListView>
);
