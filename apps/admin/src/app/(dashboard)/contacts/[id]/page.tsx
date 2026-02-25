import { serverApi } from "@app/lib/api/server";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { ContactsDetailView } from "@app/modules/contacts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ContactsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const contact = await fetchOrNotFound(() => serverApi.contacts.getById(id));

  return <ContactsDetailView initialData={contact} />;
}
