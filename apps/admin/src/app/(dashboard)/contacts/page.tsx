import { serverApi } from "@app/lib/api/server";
import { ContactsListView } from "@app/modules/contacts";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const initialData = await serverApi.contacts.getPageData();

  return <ContactsListView initialData={initialData} />;
}
