import { ContactsDetailView } from "@app/modules/contacts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactsDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ContactsDetailView id={id} />;
}
