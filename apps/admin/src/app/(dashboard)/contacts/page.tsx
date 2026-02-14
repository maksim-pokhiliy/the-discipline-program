import { api } from "@app/lib/api";
import { ContactsListView } from "@app/modules/contacts";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const initialData = await api.contacts.getPageData();

  return <ContactsListView initialData={initialData} />;
}
