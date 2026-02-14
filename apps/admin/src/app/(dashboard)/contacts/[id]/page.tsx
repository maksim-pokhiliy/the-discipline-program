import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { ContactsDetailView } from "@app/modules/contacts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ContactsDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const contact = await api.contacts.getById(id);

    return <ContactsDetailView initialData={contact} />;
  } catch {
    return notFound();
  }
}
